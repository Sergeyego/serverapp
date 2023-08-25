module.exports = function (app) {
    const db = require('../../../postgres.js');
    app.get("/acceptances/e", async (req, res) => {
        db.any("select pn.id as id, pn.dat as dat, pn.num as num, pn.id_ist as id_ist, pnt.nam as nam, pnt.en as en "+
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
    app.get("/acceptances/e/:accId", async (req, res) => {
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

}