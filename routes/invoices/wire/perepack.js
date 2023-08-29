module.exports = function (app) {
    const db = require('../../../postgres.js');
    const doc = require('../../../invoice.js');
    app.get("/invoices/wire/perepack/:invId", async (req, res) => {
        db.one("select w.num as num, w.dat as dat, 'Переупаковка' as tnam, (select d.nam from nakl_doc as d where d.id=1) as dnam, "+
            "(select f.nam from nakl_emp as f where f.id=1) as efnam, NULL as etnam "+
            "from wire_perepack_nakl as w "+
            "where w.id = $1 ", [ Number(req.params["invId"]) ] )
            .then((dataTitle) => {
                //console.log('DATA:', dataTitle);
                let query = "select 'из '||pr.nam||' '||'ф'||d.sdim||' '||k.short ||'\n в ' ||rpr.nam||' '|| "+
                    "'ф'||rd.sdim||' '||rk.short as nam, NULL as npart, sum(w.m_netto) as kvo "+
                    "from wire_perepack as w "+
                    "inner join wire_parti as p on p.id=w.id_wpartisrc "+
                    "inner join wire_parti_m as m on m.id=p.id_m "+
                    "inner join provol as pr on pr.id=m.id_provol "+
                    "inner join diam as d on d.id=m.id_diam "+
                    "inner join wire_pack_kind as k on k.id=p.id_pack "+
                    "inner join wire_parti as rp on rp.id=w.id_wpartires "+
                    "inner join wire_parti_m as rm on rm.id=rp.id_m "+
                    "inner join provol as rpr on rpr.id=rm.id_provol "+
                    "inner join diam as rd on rd.id=rm.id_diam "+
                    "inner join wire_pack_kind as rk on rk.id=rp.id_pack "+
                    "where w.id_nakl = $1 "+
                    "group by pr.nam, d.sdim, k.short, rpr.nam, rd.sdim, rk.short ";
                db.any(query, [ Number(req.params["invId"]) ] )
                    .then((dataItems) =>{
                        //console.log('DATA:', dataItems);
                        doc.createDoc(dataTitle,dataItems)
                        .then((b64string)=>{
                            res.setHeader('Content-Disposition', 'attachment; filename=invioce.docx');
                            res.send(Buffer.from(b64string, 'base64'));
                        })
                        .catch((error) => {
                            console.log('ERROR:', error);
                            res.status(500).type('text/plain');
                            res.send(error.message);
                        })
                    })
                    .catch((error) => {
                        console.log('ERROR:', error);
                        res.status(500).type('text/plain');
                        res.send(error.message);
                    })
            })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })       
    })
}