module.exports = function (app) {
    const db = require('../../postgres.js');
    const {XMLBuilder} = require('fast-xml-parser');
    const bodyParser = require('body-parser');
    require('body-parser-xml')(bodyParser);

    app.get("/dosage/recipes", async (req, res) => {
        db.any("select id as id, nam as nam from rcp_nam where lev=1 order by nam") 
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

    app.get("/dosage/recipes/:id", async (req, res) => {
        db.any("select rc.id_matr as id_matr, 'Компонент '||floor(random()*(1000-1)+1) as nam, rc.kvo as kvo from rcp_cont rc "+
                "inner join matr m on rc.id_matr=m.id "+
                "where rc.id_rcp = $1 and rc.hidden=0 "+
                "and m.cod <> 'g' order by nam", [ Number(req.params["id"]) ]) 
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

    app.get("/dosage/recipes/:id/:mas", async (req, res) => {
        date = new Date();
        db.any("select num as num, parti as parti, kvo as kvo, tiny as tiny, nbunk as nbunk, id_bunk as id_bunk, nam as nam, id_matr as id_matr from "+
                "calc_doz_new($1,$2,$3,1)", [ Number(req.params["mas"]),date, Number(req.params["id"]) ]) 
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
                    //console.log('DATE:', date);
            })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.post("/dosage/recipes/:id/:mas",bodyParser.xml(),async (req, res) => {
        date = new Date();
        db.one("insert into dosage (id_rcp, dat, tm, kvo_tot) values ( $1, $2 , $3 , $4) returning id", [ Number(req.params["id"]),date,date.toLocaleTimeString(), Number(req.params["mas"]) ]) 
            .then((data) => {
                    var query = "insert into dosage_spnd (id_dos, id_comp, kvo_comp, id_bunk, parti) values ";
                    var vals = req.body.root.item;
                    for (i = 0; i < vals.length; i++) {
                        if (i!=0){
                            query+=", ";
                        }
                        query+="("+data.id+", "+vals[i].idmatr+", "+vals[i].kvo+", "+vals[i].idbunk+", '"+vals[i].parti+"')";
                    }
                    db.any(query)
                        .then(() => {
                            const builder = new XMLBuilder();
                            let xmlDataStr = builder.build(data);
                            xmlDataStr = '<?xml version=\"1.0\" encoding=\"UTF-8\" ?>'+'<root>'+xmlDataStr+'</root>';
                            res.type('text/xml');
                            res.send(xmlDataStr);
                            //console.log('DATA:', xmlDataStr);
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

    app.post("/dosage/dosage/:iddos/:idcomp/:idbunk",bodyParser.xml(),async (req, res) => {
        //console.log('BODY:', req.body);
        db.any("update dosage_spnd set kvo_fact = $1 where id_dos = $2 and id_comp = $3 and id_bunk = $4", [Number(req.body.root.kvofact), Number(req.params["iddos"]), Number(req.params["idcomp"]), Number(req.params["idbunk"]) ]) 
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

    app.post("/dosage/result/:iddos",bodyParser.xml(),async (req, res) => {
        //console.log('BODY:', req.body);
        db.any("update dosage set result = $1 where id = $2", [Number(req.body.root.result), Number(req.params["iddos"]) ]) 
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