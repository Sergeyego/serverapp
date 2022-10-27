module.exports = function (app) {
    const db = require('../../../postgres.js');
    const doc = require('../../../invoice.js');
    app.get("/invoices/wire/warehouse/:typeId", async (req, res) => {
        db.one("select w.num as num, w.dat as dat, t.fnam as tnam, d.nam as dnam, ef.nam as efnam, et.nam as etnam from wire_whs_waybill as w "+
            "inner join wire_way_bill_type as t on t.id=w.id_type "+
            "inner join nakl_doc as d on t.id_doc=d.id "+
            "inner join nakl_emp as ef on t.id_from=ef.id "+
            "inner join nakl_emp as et on t.id_to=et.id "+
            "where w.id = $1 ", [ Number(req.params["typeId"]) ] )
            .then((dataTitle) => {
                //console.log('DATA:', dataTitle);
                let query = "select ('проволока '||pr.nam||' '||'ф'||d.sdim||' '||k.short) as nam, m.n_s as npart, w.m_netto as kvo from wire_warehouse as w "+
                    "inner join wire_parti as p on p.id=w.id_wparti "+
                    "inner join wire_parti_m as m on m.id=p.id_m "+
                    "inner join provol as pr on pr.id=m.id_provol "+
                    "inner join diam as d on d.id=m.id_diam "+
                    "inner join wire_pack_kind as k on k.id=p.id_pack "+
                    "where w.id_waybill = $1 order by w.id";
                db.any(query, [ Number(req.params["typeId"]) ] )
                    .then((dataItems) =>{
                        //console.log('DATA:', dataItems);
                        doc.createDoc(dataTitle,dataItems)
                        .then((b64string)=>{
                            res.setHeader('Content-Disposition', 'attachment; filename=invioce.docx');
                            res.send(Buffer.from(b64string, 'base64'));
                        })
                        .catch((error) => {
                            console.log('ERROR:', error);
                            res.status(500);
                            res.json(error);
                        })
                    })
                    .catch((error) => {
                        console.log('ERROR:', error);
                        res.status(500);
                        res.json(error);
                    })
            })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500);
                res.json(error);
            })       
    })
}