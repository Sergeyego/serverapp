module.exports = function (app) {
    const db = require('../../../postgres.js');
    var bodyParser = require('body-parser');
    var jsonParser = bodyParser.json();

    app.get("/acceptances/w", async (req, res) => {
        db.any("select www.id as id, to_char(www.dat,'YYYY-mm-dd') as dat, www.num as num, www.id_type as id_type, wwbt.nam as nam "+
            "from wire_whs_waybill www "+
            "inner join wire_way_bill_type wwbt on wwbt.id = www.id_type "+
            "where wwbt.en = true and www.dat between $1 and $2 "+
            "order by www.dat desc, www.num desc", [ String(req.query.datbeg), String(req.query.datend) ]) 
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })
    app.get("/acceptances/w/data/:accId", async (req, res) => {
        db.any("select ww.id as id, ww.id_wparti as id_part, ww.m_netto as kvo, ww.pack_kvo as shtuk, ww.numcont as numcont, "+
            "ww.barcodecont as barcodecont, ww.chk as chk, wpm.n_s as n_s, to_char(wpm.dat,'YYYY-mm-DD') as dat_part, "+
            "p.nam ||' ф '||d.sdim ||' '||wpk.short as marka, wp2.pack_ed as pack_ed, wp2.pack_group as pack_group "+
            "from wire_warehouse ww "+
            "inner join wire_parti wp on wp.id = ww.id_wparti "+
            "inner join wire_parti_m wpm on wpm.id = wp.id_m "+
            "inner join provol p on p.id = wpm.id_provol "+
            "inner join diam d on d.id = wpm.id_diam "+
            "inner join wire_pack_kind wpk on wpk.id = wp.id_pack "+
            "inner join wire_pack wp2 on wp2.id = wp.id_pack_type "+
            "where ww.id_waybill = $1 order by ww.id ", [ Number(req.params["accId"]) ])
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })
    app.get("/acceptances/types/w", async (req, res) => {
        db.any("select wwbt.id as id, wwbt.nam as nam "+
            "from wire_way_bill_type wwbt where wwbt.en = true "+
            "order by wwbt.nam", []) 
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })
    app.get("/acceptances/parti/w/:partId", async (req, res) => {
        db.any("select wpm.n_s as n_s, to_char(wpm.dat,'YYYY-mm-DD') as dat_part, p.nam ||' ф '||d.sdim ||' '||wpk.short as marka, "+
            "wp2.pack_ed as pack_ed, wp2.pack_group as pack_group, wp2.mas_ed as mass_ed, wp2.mas_group as mass_group, ws.nam as src "+
            "from wire_parti wp "+
            "inner join wire_parti_m wpm on wpm.id = wp.id_m "+
            "inner join provol p on p.id = wpm.id_provol "+
            "inner join diam d on d.id = wpm.id_diam "+
            "inner join wire_pack_kind wpk on wpk.id = wp.id_pack "+
            "inner join wire_pack wp2 on wp2.id = wp.id_pack_type "+
            "inner join wire_source ws on ws.id = wpm.id_source "+
            "where wp.id = $1", [ Number(req.params["partId"]) ]) 
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.post("/acceptances/w", jsonParser, async (req, res) => {
        db.any("insert into wire_whs_waybill (id_type, num, dat) values ($1, $2, $3) returning id", [ Number(req.body.id_type), String(req.body.num), String(req.body.dat) ]) 
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.delete("/acceptances/w/:accId", async (req, res) => {
        db.any("delete from wire_whs_waybill where id = $1", [ Number(req.params["accId"]) ]) 
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.patch("/acceptances/w/:accId", jsonParser, async (req, res) => {
        db.any("update wire_whs_waybill set id_type = $1, num = $2, dat = $3 where id = $4", [ Number(req.body.id_type), String(req.body.num), String(req.body.dat), Number(req.params["accId"]) ]) 
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.post("/acceptances/w/data", jsonParser, async (req, res) => {
        db.any("insert into wire_warehouse (id_wparti, m_netto, pack_kvo, numcont, barcodecont, chk, id_waybill)"+
            " values ($1, $2, $3, $4, $5, $6, $7) returning id", 
            [ Number(req.body.id_part), Number(req.body.kvo), Number(req.body.shtuk), Number(req.body.numcont), String(req.body.barcodecont), 
                String(req.body.chk), Number(req.body.id_nakl) ]) 
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.delete("/acceptances/w/data/:dataId", async (req, res) => {
        db.any("delete from wire_warehouse where id = $1", [ Number(req.params["dataId"]) ]) 
            .then((data) => {
                    res.json(data)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.patch("/acceptances/w/data/:dataId", jsonParser, async (req, res) => {
        db.any("update wire_warehouse set m_netto = $1, pack_kvo = $2, numcont = $3 where id = $4", [ Number(req.body.kvo), Number(req.body.shtuk), Number(req.body.numcont), Number(req.params["dataId"]) ]) 
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