module.exports = function (app) {
    const db = require('../../../postgres.js');
    const doc = require('../../../invoice.js');
    app.get("/invoices/wire/warehouseday/:typeId/:dayId", async (req, res) => {
        db.one("select date_part('doy', $1 ::date) as num, $2 ::date as dat, t.fnam as tnam, d.nam as dnam, ef.nam as efnam, et.nam as etnam "+
            "from wire_way_bill_type t "+
            "inner join nakl_doc as d on t.id_doc=d.id "+
            "inner join nakl_emp as ef on t.id_from=ef.id "+
            "inner join nakl_emp as et on t.id_to=et.id "+
            "where t.id = $3", [ String(req.params["dayId"]), String(req.params["dayId"]), Number(req.params["typeId"]) ] )
            .then((dataTitle) => {
                //console.log('DATA:', dataTitle);
                let query = "select ('проволока '||pr.nam||' '||'ф'||d.sdim||' '||k.short) as nam, m.n_s as npart, sum(w.m_netto) as kvo "+
                    "from wire_warehouse as w "+
                    "inner join wire_whs_waybill www on www.id = w.id_waybill "+
                    "inner join wire_parti as p on p.id=w.id_wparti "+
                    "inner join wire_parti_m as m on m.id=p.id_m "+
                    "inner join provol as pr on pr.id=m.id_provol "+
                    "inner join diam as d on d.id=m.id_diam "+
                    "inner join wire_pack_kind as k on k.id=p.id_pack "+
                    "where www.id_type = $1 and www.dat = $2 "+
                    "group by pr.nam, d.sdim, k.short, m.n_s "+
                    "order by pr.nam, d.sdim, k.short, m.n_s";
                db.any(query, [ Number(req.params["typeId"]), String(req.params["dayId"]) ] )
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