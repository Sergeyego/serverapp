module.exports = function (app) {
    const db = require('../../../postgres.js');
    app.get("/invoices/elrtr/workshop/:invoiceId", async (req, res) => {
        db.one("select n.num as num, n.dat as dat, t.nam as tnam, d.nam as dnam, ef.nam as efnam, et.nam as etnam from parti_nakl as n "+
                "inner join parti_nakl_tip as t on t.id=n.tip "+
                "inner join nakl_doc as d on t.id_doc=d.id "+
                "inner join nakl_emp as ef on t.id_from=ef.id "+
                "inner join nakl_emp as et on t.id_to=et.id "+
                "where n.id = $1", Number(req.params["invoiceId"]))
            .then((dataTitle) => {
                console.log('DATA:', dataTitle);
                //res.status(200).type('text/plain');
                res.json(dataTitle);
            })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(404).type('text/plain');
                res.send('Not found');
            })

        
    })
}