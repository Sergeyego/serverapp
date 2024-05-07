const db = require('../../../postgres.js');

let insNumber = function (val, dec){
    if (dec!=0){
        return val!=null ? new Intl.NumberFormat("ru-RU", {style: "decimal", minimumFractionDigits : dec, maximumFractionDigits : dec}).format(val) : "";
    } else {
        return val!=null ? new Intl.NumberFormat("ru-RU", {style: "decimal", minimumFractionDigits : dec }).format(val) : "";
    }
}

module.exports = function (app) {
    app.use("/packnakl/elrtr/:dat/:id_master/", async (req, res) => {

        db.any("select * from el_pallet_op where id_main_rab = $1"
        , [ Number(req.params["id_master"]) ] )
        .then((data) => {

            res.render(__dirname+"/../../../views/nakl.hbs",{

            })
        })
        .catch((error) => {
            console.log('ERROR:', error);
            res.status(500).type('text/plain');
            res.send(error.message);
        })            
    });     
 }
