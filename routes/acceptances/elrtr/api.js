module.exports = function (app) {
    const db = require('../../../postgres.js');
    var bodyParser = require('body-parser');
    var jsonParser = bodyParser.json();

    app.get("/acceptances/e", async (req, res) => {
        db.any("select pn.id as id, to_char(pn.dat,'YYYY-MM-dd') as dat, pn.num as num, pn.id_ist as id_type, pnt.nam as nam "+
            "from prod_nakl pn "+
            "inner join prod_nakl_tip pnt on pnt.id = pn.id_ist "+
            "where pnt.en = true and pn.dat between $1::date and $2::date "+
            "order by pn.dat desc, pn.num desc", [ String(req.query.datbeg), String(req.query.datend) ]) 
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })
    app.get("/acceptances/e/data/:accId", async (req, res) => {
        db.any("select p.id as id, p.id_part as id_part, p.kvo as kvo, p.shtuk as shtuk, p.numcont as numcont, p.barcodecont as barcodecont, "+
            "p.chk as chk, p2.n_s as n_s, to_char(p2.dat_part,'YYYY-MM-dd') as dat_part, e.marka || ' ф '||cast(p2.diam as varchar(3)) as marka, "+
            "ep.pack_ed as pack_ed, ep.pack_group as pack_group "+
            "from prod p "+
            "inner join parti p2 on p2.id = p.id_part "+
            "inner join elrtr e on e.id = p2.id_el "+
            "inner join el_pack ep on ep.id = p2.id_pack "+
            "where p.id_nakl = $1 order by id", [ Number(req.params["accId"]) ])
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })
    app.get("/acceptances/types/e", async (req, res) => {
        db.any("select pnt.id as id, pnt.nam as nam "+
            "from prod_nakl_tip pnt where pnt.en = true "+
            "order by pnt.nam", []) 
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })
    app.get("/acceptances/parti/e/:partId", async (req, res) => {
        db.any("select p.n_s as n_s, to_char(p.dat_part,'YYYY-MM-dd') as dat_part, e.marka ||' ф '|| cast(p.diam as varchar(3)) as marka, "+
            "ep.pack_ed as pack_ed, ep.pack_group as pack_group, ep.mass_ed as mass_ed, ep.mass_group as mass_group, i.nam as src "+
            "from parti p "+
            "inner join elrtr e on e.id = p.id_el "+
            "inner join el_pack ep on ep.id = p.id_pack "+
            "inner join istoch i on i.id = p.id_ist "+
            "where p.id = $1", [ Number(req.params["partId"]) ]) 
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.post("/acceptances/e", jsonParser, async (req, res) => {
        db.any("insert into prod_nakl (id_ist, num, dat) values ($1, $2, $3) returning id", [ Number(req.body.id_type), String(req.body.num), String(req.body.dat) ]) 
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.delete("/acceptances/e/:accId", async (req, res) => {
        db.any("delete from prod_nakl where id = $1", [ Number(req.params["accId"]) ]) 
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.patch("/acceptances/e/:accId", jsonParser, async (req, res) => {
        db.any("update prod_nakl set id_ist = $1, num = $2, dat = $3 where id = $4", [ Number(req.body.id_type), String(req.body.num), String(req.body.dat), Number(req.params["accId"]) ]) 
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.post("/acceptances/e/data", jsonParser, async (req, res) => {
        db.any("insert into prod (id_part, kvo, shtuk, numcont, barcodecont, chk, id_nakl, id_ist, dat, docs)"+
            " values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) returning id", 
            [ Number(req.body.id_part), Number(req.body.kvo), Number(req.body.shtuk), Number(req.body.numcont), String(req.body.barcodecont), String(req.body.chk),
                Number(req.body.id_nakl), Number(req.body.id_type), String(req.body.dat), String(req.body.docs) ]) 
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.delete("/acceptances/e/data/:dataId", async (req, res) => {
        db.any("delete from prod where id = $1", [ Number(req.params["dataId"]) ]) 
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.patch("/acceptances/e/data/:dataId", jsonParser, async (req, res) => {
        db.any("update prod set kvo = $1, shtuk = $2, numcont = $3 where id = $4", [ Number(req.body.kvo), Number(req.body.shtuk), Number(req.body.numcont), Number(req.params["dataId"]) ]) 
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