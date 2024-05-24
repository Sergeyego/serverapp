const qr = require("../../qrcode/qr");
const db = require('../../../postgres.js');
const locale = require('../../../locale.js');

let getQrCode = function (headerdata){
    let code = "";
    if (headerdata.ean.length==13){
        code+=headerdata.ean;
        let id_part='w'+String(headerdata.id_part);
        id_part=id_part.padEnd(8,'_');

        code+=id_part;
        code+=headerdata.n_s.slice(0,4).padStart(4,'0');
        code+="-"+String(headerdata.year).slice(0,4).padStart(4,'0');

        let kvo=String(Number(headerdata.kvo)*100).padStart(6,'0');
        let pack_kvo=String(Number(headerdata.pack_kvo)).padStart(4,'0');

        code+=kvo+pack_kvo+headerdata.pallet.slice(0,10).padStart(10,'0');
    }
    return qr.encodeBase64Url(Buffer.from(code));
}

module.exports = function (app) {
    app.use("/packlists/old/w/:pallet/:id_part/:kvo/", async (req, res) => {
        let pack_kvo = (typeof req.query.pack_kvo!="undefined")? Number(req.query.pack_kvo) : null;
        db.one("select wp.id as id_part, p.nam as marka, d.diam as diam, wpm.n_s as n_s, wpm.dat as dat_part, date_part('year',wpm.dat) as year, wp2.mas_ed as mas_ed, "+
            "coalesce(we.ean_group, we.ean_ed) as ean, wpk.short as spool, pb.n_plav as plav, $2 as pallet, $3 as kvo, coalesce($4,$3/wp2.mas_ed) as pack_kvo "+
            "from wire_parti wp "+
            "inner join wire_parti_m wpm on wpm.id = wp.id_m "+
            "inner join provol p on p.id = wpm.id_provol "+
            "inner join diam d on d.id = wpm.id_diam "+
            "inner join wire_pack wp2 on wp2.id = wp.id_pack_type "+
            "left join wire_ean we on we.id_prov = wpm.id_provol and we.id_diam = wpm.id_diam and we.id_spool = wp.id_pack and we.id_pack = wp.id_pack_type "+
            "inner join wire_pack_kind wpk on wpk.id = wp.id_pack "+
            "inner join prov_buht pb on pb.id = wpm.id_buht "+
            "where wp.id = $1"
        , [ Number(req.params["id_part"]), String(req.params["pallet"]), Number(req.params["kvo"]), pack_kvo ] )
        .then((dataTitle) => {
            if (dataTitle.ean!=null){       
                let packer = (typeof req.query.packer!="undefined") ?  qr.decodeBase64Url(req.query.packer) : "________________";
                let dat_pack = (typeof req.query.dat_pack!="undefined") ?  req.query.dat_pack : locale.insDate(new Date());
                let spool_nam = "Тип носителя";
                let packer_nam = "Мастер";
                let pack_nam = "Количество кассет";
                let spool = dataTitle.spool;

                if (dataTitle.spool.indexOf("L-")==0){
                    spool_nam = "Длина, мм";
                    spool=dataTitle.spool.substring(2);
                    pack_nam = "Количество мест";
                    packer_nam = "Упаковщик";
                    packer = "________________";
                }

                res.render(__dirname+"/../../../views/packwire.hbs",{
                    pallet: dataTitle.pallet,
                    marka: dataTitle.marka,
                    diam: locale.insNumber(dataTitle.diam,1),
                    spool_nam: spool_nam,
                    spool: spool,
                    plav: dataTitle.plav,
                    n_s: dataTitle.n_s,
                    pack_nam: pack_nam,
                    kvo: locale.insNumber(dataTitle.kvo,0),
                    pack_kvo: locale.insNumber(dataTitle.pack_kvo,0),
                    dat_pack: dat_pack,
                    packer_nam: packer_nam,
                    packer: packer,
                    qrdata: getQrCode(dataTitle)
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
