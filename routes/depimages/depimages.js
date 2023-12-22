module.exports = function (app) {
    const db = require('../../postgres.js');
    app.get("/depimages/:depId.png", async (req, res) => {
        db.one("select zv.simb as simb from zvd_ved zv where zv.id = $1", req.params['depId']) 
            .then((data) => {
                    res.type('image/png');
                    res.send(data.simb)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })
}