module.exports = function (app) {
    const db = require('../../../postgres.js');
    var bodyParser = require('body-parser');
    var jsonParser = bodyParser.json();

    app.get("/pack/e/cex", async (req, res) => {
        db.any("select id, nam from cex where is_el = true")
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.get("/pack/e/data/:id_cex/:cl_op", async (req, res) => {
        db.any("select to_char(epo.dtm,'HH:MI') as time, e.marka || ' ф '|| p.diam as marka, "+
            "p.n_s ||'-'||date_part('year',p.dat_part) as parti, epo.kvo as kvo, "+
            "p2.nam as pallet, rr.snam as rab, rr2.snam as master "+
            "from el_pallet_op epo "+
            "inner join parti p on p.id = epo.id_parti "+
            "inner join elrtr e on e.id = p.id_el "+
            "inner join rab_rab rr on rr.id = epo.id_rab "+
            "inner join rab_rab rr2 on rr2.id = epo.id_main_rab "+
            "inner join pallets p2 on p2.id = epo.id_pallet "+
            "inner join istoch i on i.id = epo.id_src "+
            "where epo.id_cex = $1 and i.cl_op = $2 "+
            "order by epo.dtm desc"
            ,[ Number(req.params["id_cex"]), Number(req.params["cl_op"])])
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

}
