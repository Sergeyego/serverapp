const qr = require("../../qrcode/qr");

module.exports = function (app) {
    app.use("/packlists/elrtr/:id/", async (req, res) => {
        res.render(__dirname+"/../../../views/pack.hbs",{
                                    header: "123" 
                                })
        })    
 }
