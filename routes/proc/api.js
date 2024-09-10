module.exports = function (app) {
    const db = require('../../postgres.js');
    const {XMLBuilder} = require('fast-xml-parser');
    const bodyParser = require('body-parser');
    require('body-parser-xml')(bodyParser);

    app.get("/proc/channel/:id", async (req, res) => {
        db.any("select id, number, nam, color_ust, color_val, is_main, pwr from owens_trm_channel where id = $1",[ Number(req.params["id"]) ]) 
            .then((data) => {
                    const options = {
                        format: false,
                        arrayNodeName: 'item'
                    };                    
                    const builder = new XMLBuilder(options);
                    let xmlDataStr = builder.build(data);
                    xmlDataStr = '<?xml version=\"1.0\" encoding=\"UTF-8\" ?>'+'<root>'+xmlDataStr+'</root>';
                    res.type('text/xml');
                    res.send(xmlDataStr);
            })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.get("/proc/oven/:id", async (req, res) => {
        db.any("select id, num, pwr_cool from owens where id = $1",[ Number(req.params["id"]) ]) 
            .then((data) => {
                    const options = {
                        format: false,
                        arrayNodeName: 'item'
                    };                    
                    const builder = new XMLBuilder(options);
                    let xmlDataStr = builder.build(data);
                    xmlDataStr = '<?xml version=\"1.0\" encoding=\"UTF-8\" ?>'+'<root>'+xmlDataStr+'</root>';
                    res.type('text/xml');
                    res.send(xmlDataStr);
            })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.get("/proc/parti", async (req, res) => {
        date = new Date();
        date.setSeconds(date.getSeconds() - 2592000);
        db.any("SELECT p.n_s as num, e.marka || ' ф '  || d.sdim as mark, to_char(p.dat_part,'DD.MM.YYYY') as dat, p.id as id FROM parti as p "+
			"inner join elrtr as e on e.id=p.id_el "+
			"left join diam as d on d.diam=p.diam "+
			"WHERE p.id_ist = 1 and p.dat_part > $1 ORDER BY p.dat_part DESC, p.n_s DESC",[ date ]) 
            .then((data) => {
                    const options = {
                        format: false,
                        arrayNodeName: 'item'
                    };                    
                    const builder = new XMLBuilder(options);
                    let xmlDataStr = builder.build(data);
                    xmlDataStr = '<?xml version=\"1.0\" encoding=\"UTF-8\" ?>'+'<root>'+xmlDataStr+'</root>';
                    res.type('text/xml');
                    res.send(xmlDataStr);
            })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.get("/proc/parti/:id_part", async (req, res) => {
        db.any("SELECT p.n_s as num, e.marka || ' ф '  || d.sdim as mark, to_char(p.dat_part,'DD.MM.YYYY') as dat, p.id as id FROM parti as p "+
			"inner join elrtr as e on e.id=p.id_el "+
			"left join diam as d on d.diam=p.diam "+
			"WHERE p.id = $1",[ Number(req.params["id_part"]) ]) 
            .then((data) => {
                    const options = {
                        format: false,
                        arrayNodeName: 'item'
                    };                    
                    const builder = new XMLBuilder(options);
                    let xmlDataStr = builder.build(data);
                    xmlDataStr = '<?xml version=\"1.0\" encoding=\"UTF-8\" ?>'+'<root>'+xmlDataStr+'</root>';
                    res.type('text/xml');
                    res.send(xmlDataStr);
            })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.get("/proc/rabs", async (req, res) => {
        db.any("select r.id as id, r.snam as nam from rab_rab r inner join rab_qual q on q.id_rab=r.id "+
			"inner join rab_prof p on q.id_prof = p.id "+
			"WHERE q.dat = (select max(dat) from rab_qual where dat <= '2999-04-01' "+
			"and id_rab=r.id) and p.id=8 order by r.snam") 
            .then((data) => {
                    const options = {
                        format: false,
                        arrayNodeName: 'item'
                    };                    
                    const builder = new XMLBuilder(options);
                    let xmlDataStr = builder.build(data);
                    xmlDataStr = '<?xml version=\"1.0\" encoding=\"UTF-8\" ?>'+'<root>'+xmlDataStr+'</root>';
                    res.type('text/xml');
                    res.send(xmlDataStr);
            })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.get("/proc/progs/:id_part", async (req, res) => {
        db.any("select r.id, r.nam, r.ide, r.fnam from  get_dry_progs( $1 ) as r order by r.nam",[ Number(req.params["id_part"]) ]) 
            .then((data) => {
                    const options = {
                        format: false,
                        arrayNodeName: 'item'
                    };                    
                    const builder = new XMLBuilder(options);
                    let xmlDataStr = builder.build(data);
                    xmlDataStr = '<?xml version=\"1.0\" encoding=\"UTF-8\" ?>'+'<root>'+xmlDataStr+'</root>';
                    res.type('text/xml');
                    res.send(xmlDataStr);
            })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.get("/proc/progdata/:id_prog/:vl/:temp/:id_oven", async (req, res) => {
        db.any("select step, tim, tra from calc_proga_new( $1, $2, $3, $4 ) order by step",
            [ Number(req.params["id_prog"]), Number(req.params["vl"]), Number(req.params["temp"]), Number(req.params["id_oven"]) ]) 
            .then((data) => {
                    const options = {
                        format: false,
                        arrayNodeName: 'item'
                    };                    
                    const builder = new XMLBuilder(options);
                    let xmlDataStr = builder.build(data);
                    xmlDataStr = '<?xml version=\"1.0\" encoding=\"UTF-8\" ?>'+'<root>'+xmlDataStr+'</root>';
                    res.type('text/xml');
                    res.send(xmlDataStr);
            })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.post("/proc/newproc",bodyParser.xml(),async (req, res) => {
        //console.log('BODY:', req.body);
        date = new Date();
        db.one("insert into owens_rab (id_owen, id_rab, id_eldim, id_prog, n_s, zms, w0, t0, dt_beg, kvo, id_part, new_format) values "+
            "($1, $2, (select ide from dry_reg where id = $3), $4, $5, $6, $7, $8, $9, $10, $11, true) returning id", 
            [Number(req.body.root.id_oven), Number(req.body.root.id_rab), Number(req.body.root.id_prog), Number(req.body.root.id_prog), String(req.body.root.parti), 
                String(req.body.root.zms), Number(req.body.root.w0), Number(req.body.root.t0), date, Number(req.body.root.kvo), Number(req.body.root.id_part)
             ]) 
            .then((data) => {
                    const builder = new XMLBuilder();
                    let xmlDataStr = builder.build(data);
                    xmlDataStr = '<?xml version=\"1.0\" encoding=\"UTF-8\" ?>'+'<root>'+xmlDataStr+'</root>';
                    res.type('text/xml');
                    res.send(xmlDataStr);
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

}