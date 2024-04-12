module.exports = function (app) {
    const db = require('../../postgres.js');
    app.get("/signatures/:lang/:dat.png", async (req, res) => {
        let query = "select sign_"+req.params['lang']+" as sign from general_data where dat = '"+req.params['dat']+"'";
        db.one(query) 
            .then((data) => {
                    res.type('image/png');
                    res.send(data.sign)
                })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })
}