const qr = require("../../qrcode/qr");
const db = require('../../../postgres.js');
const locale = require('../../../locale.js');
const create = require('./create.js');

module.exports = function (app) {
    app.use("/packlists/old/e/:pallet/:id_part/:kvo/", async (req, res) => {
        let pack_kvo = (typeof req.query.pack_kvo!="undefined")? Number(req.query.pack_kvo) : null;
        db.one("select p.id as id_part, e.marka as marka, p.diam as diam, p.n_s as n_s, p.dat_part as dat_part, date_part('year',p.dat_part) as year, "+
            "ep.mass_ed as mass_ed, ee.ean_group as ean, $2 as pallet, $3 as kvo, coalesce($4,$3/mass_ed) as pack_kvo "+
            "from parti p "+
            "inner join elrtr e on e.id = p.id_el "+
            "inner join el_pack ep on ep.id = p.id_pack "+
            "left join ean_el ee on ee.id_el = p.id_el and ee.id_diam = (select d.id from diam d where d.diam=p.diam) and ee.id_pack = p.id_pack "+
            "where p.id = $1"
        , [ Number(req.params["id_part"]), String(req.params["pallet"]), Number(req.params["kvo"]), pack_kvo ] )
        .then((dataTitle) => {
            if (dataTitle.ean!=null){          
                let packer = (typeof req.query.packer!="undefined") ?  qr.decodeBase64Url(req.query.packer) : "";
                let dat_pack = (typeof req.query.dat_pack!="undefined") ?  req.query.dat_pack : locale.insDate(new Date());

                res.render(__dirname+"/../../../views/packel.hbs",{
                    pallet: dataTitle.pallet,
                    marka: dataTitle.marka,
                    diam: locale.insNumber(dataTitle.diam,1),
                    n_s: dataTitle.n_s,
                    kvo: locale.insNumber(dataTitle.kvo,0),
                    pack_kvo: locale.insNumber(dataTitle.pack_kvo,0),
                    dat_part: locale.insDate(dataTitle.dat_part),
                    dat_pack: dat_pack,
                    packer: packer,
                    qrdata: create.getQrCode(dataTitle)
                })
            } else {
                res.status(500).type('text/plain');
                res.send("Нет штрихкода");
            }
        })
        .catch((error) => {
            console.log('ERROR:', error);
            res.status(500).type('text/plain');
            res.send(error.message);
        })
    });
 }
