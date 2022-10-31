module.exports = function (app) {
    const db = require('../../../postgres.js');
    const doc = require('../../../invoice.js');
    app.get("/invoices/wire/semifinished/:vidId/:typeId/:dayId", async (req, res) => {
        db.one("select date_part('doy', $1 ::date) as num, $2 ::date as dat, t.snam ||': '||(select wpt.snam from wire_podt_type wpt where wpt.id = $3 ) as tnam, "+
            " d.nam as dnam, ef.nam as efnam, et.nam as etnam "+
            "from wire_podt_op as t "+
            "inner join nakl_doc as d on t.id_doc=d.id "+
            "inner join nakl_emp as ef on t.id_from=ef.id "+
            "inner join nakl_emp as et on t.id_to=et.id "+
            "where t.id = $4 ", [ String(req.params["dayId"]), String(req.params["dayId"]), Number(req.params["vidId"]), Number(req.params["typeId"]) ] )
            .then((dataTitle) => {
                //console.log('DATA:', dataTitle);
                let query = "select coalesce(p2.nam, p.nam)||' ф '|| d.sdim as nam, wp.n_s as npart, wpc.kvo as kvo "+
                    "from wire_podt_cex wpc "+
                    "inner join wire_podt wp on wp.id =wpc.id_podt "+
                    "inner join prov_buht pb on pb.id=wp.id_buht "+
                    "inner join prov_prih pp on pp.id =pb.id_prih "+
                    "inner join provol p on p.id = pp.id_pr "+
                    "inner join diam d on d.id = wp.id_diam "+
                    "left join provol p2 on p2.id = p.id_base "+
                    "where wpc.id_op = $1 and wpc.dat = $2 and wp.id_type = $3 ";
                db.any(query, [ Number(req.params["typeId"]), String(req.params["dayId"]), Number(req.params["vidId"]) ] )
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