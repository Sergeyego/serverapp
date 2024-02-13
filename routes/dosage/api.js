module.exports = function (app) {
    const db = require('../../postgres.js');
    const {XMLBuilder} = require('fast-xml-parser');

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
        db.any("select num as num, parti as parti, kvo as kvo, tiny as tiny, nbunk as nbunk, id_bunk as id_bunk, nam as nam, id_matr as id_matr from "+
                "calc_doz($1,'2024-01-13 00:00:00',$2)", [ Number(req.params["mas"]), Number(req.params["id"]) ]) 
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

}