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

    app.get("/pack/e/src/:cl_op", async (req, res) => {
        db.any("select i.id as id, i.nakl_nam as nam from istoch i where i.cl_op = $1"
        ,[ Number(req.params["cl_op"])])
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.get("/pack/rab/:id", async (req, res) => {
        db.any("select id, snam from rab_rab where id = $1"
        ,[ Number(req.params["id"])])
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.get("/pack/e/master", async (req, res) => {
        db.any("select rr.id as id, rr.snam as nam from rab_rab rr "+
            "where rr.id in (select q.id_rab from rab_qual q "+
            "inner join rab_prof p on q.id_prof = p.id "+
            "WHERE q.dat = (select max(dat) from rab_qual where dat <= '2999-04-01' "+
            "and id_rab=q.id_rab) and p.id=26 ) order by rr.snam ")
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.get("/pack/e/parti/:id_part", async (req, res) => {
        db.any("select p.n_s as n_s, to_char(p.dat_part,'YYYY-MM-dd') as dat_part, e.marka ||' ф '|| cast(p.diam as varchar(3)) as marka, "+
            "ep.pack_ed as pack_ed, ep.mass_ed as mass_ed, ep.mass_pallet as mass_pallet, i.nam as src, i.id as id_src, "+
            "(select epo.id_main_rab from el_pallet_op epo where epo.dtm=(select max(dtm) from el_pallet_op) limit 1) as id_master "+
            "from parti p "+
            "inner join elrtr e on e.id = p.id_el "+
            "inner join el_pack ep on ep.id = p.id_pack "+
            "inner join istoch i on i.id = p.id_ist "+
            "where p.id = $1"
            ,[ Number(req.params["id_part"])])
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
        db.any("select to_char(epo.dtm,'HH24:MI') as time, e.marka || ' ф '|| p.diam as marka, "+
            "p.n_s ||'-'||date_part('year',p.dat_part) as parti, epo.kvo as kvo, "+
            "p2.nam as pallet, rr.snam as rab, rr2.snam as master, i.nam as src, epo.id_src as id_src "+
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

    app.post("/pack/e/data", jsonParser, async (req, res) => {
        let date = new Date();
        let id_op = String(req.body.pallet).length==10 ? 2 : 1;
        db.any("insert into el_pallet_op (id_pallet, dtm, id_cex, id_op, id_rab, id_main_rab, kvo, pack_kvo, id_parti, id_src)"+
            " values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning id", 
            [ Number(3), date, Number(req.body.id_cex), Number(id_op), Number(req.body.id_rab), Number(req.body.id_master),
                Number(req.body.kvo), Number(req.body.pack_kvo), Number(req.body.id_part), Number(req.body.id_src) ]) 
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
