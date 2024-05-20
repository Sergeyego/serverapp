const qr = require("../../qrcode/qr");
const db = require('../../../postgres.js');
const locale = require('../../../locale.js');

let getQrCode = function (headerdata){    
    let code = "";
    if (headerdata.ean.length==13){
        code+=headerdata.ean;
        let id_part='e'+String(headerdata.id_part);
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
    app.use("/packlists/elrtr/:id/", async (req, res) => {

        db.one("select epo.id_parti as id_part, date_part('year',p.dat_part) as year, p2.nam as pallet, e.marka as marka, p.diam as diam, p.n_s as n_s, p.dat_part as dat_part, "+
            "(select sum(epo2.kvo) from el_pallet_op epo2 where epo2.id_pallet = epo.id_pallet and epo2.id_op in (1,2)) as kvo, "+
            "(select sum(epo3.pack_kvo) from el_pallet_op epo3 where epo3.id_pallet = epo.id_pallet and epo3.id_op in (1,2)) as pack_kvo, "+
            "ee.ean_group as ean, "+
            "(select epo4.dtm from el_pallet_op epo4 where epo4.id_pallet = epo.id_pallet and epo4.id_op=1) as dat_sort, "+
            "(select rr.snam from el_pallet_op epo5 inner join rab_rab rr on rr.id = epo5.id_rab where epo5.id_pallet = epo.id_pallet and epo5.id_op=1) as rab_sort, "+
            "(select rr2.snam from el_pallet_op epo6 inner join rab_rab rr2 on rr2.id = epo6.id_main_rab where epo6.id_pallet = epo.id_pallet and epo6.id_op=1) as master_sort, "+
            "(select epo7.kvo from el_pallet_op epo7 where epo7.id_pallet = epo.id_pallet and epo7.id_op=1) as kvo_sort, "+
            "(select epo8.pack_kvo from el_pallet_op epo8 where epo8.id_pallet = epo.id_pallet and epo8.id_op=1) as pack_kvo_sort, "+
            "(select epo4.dtm from el_pallet_op epo4 where epo4.id_pallet = epo.id_pallet and epo4.id_op=2) as dat_dosort, "+
            "(select rr.snam from el_pallet_op epo5 inner join rab_rab rr on rr.id = epo5.id_rab where epo5.id_pallet = epo.id_pallet and epo5.id_op=2) as rab_dosort, "+
            "(select rr2.snam from el_pallet_op epo6 inner join rab_rab rr2 on rr2.id = epo6.id_main_rab where epo6.id_pallet = epo.id_pallet and epo6.id_op=2) as master_dosort, "+
            "(select epo7.kvo from el_pallet_op epo7 where epo7.id_pallet = epo.id_pallet and epo7.id_op=2) as kvo_dosort, "+
            "(select epo8.pack_kvo from el_pallet_op epo8 where epo8.id_pallet = epo.id_pallet and epo8.id_op=2) as pack_kvo_dosort, "+
            "(select epo4.dtm from el_pallet_op epo4 where epo4.id_pallet = epo.id_pallet and epo4.id_op=0) as dat_tpack, "+
            "(select rr.snam from el_pallet_op epo5 inner join rab_rab rr on rr.id = epo5.id_rab where epo5.id_pallet = epo.id_pallet and epo5.id_op=0) as rab_tpack, "+
            "(select rr2.snam from el_pallet_op epo6 inner join rab_rab rr2 on rr2.id = epo6.id_main_rab where epo6.id_pallet = epo.id_pallet and epo6.id_op=0) as master_tpack, "+
            "(select epo7.kvo from el_pallet_op epo7 where epo7.id_pallet = epo.id_pallet and epo7.id_op=0) as kvo_tpack, "+
            "(select epo8.pack_kvo from el_pallet_op epo8 where epo8.id_pallet = epo.id_pallet and epo8.id_op=0) as pack_kvo_tpack "+
            "from el_pallet_op epo "+
            "inner join parti p on p.id = epo.id_parti "+
            "inner join elrtr e on e.id = p.id_el "+
            "inner join pallets p2 on p2.id = epo.id_pallet "+
            "inner join ean_el ee on ee.id_el = p.id_el and ee.id_diam = (select d.id from diam d where d.diam = p.diam) and ee.id_pack = p.id_pack "+
            "where epo.id = $1 "
        , [ Number(req.params["id"]) ] )
        .then((dataTitle) => {

            let sign = '<tr class="spantext">'+
            '<td></td><td class="centeralign">подпись</td><td class="centeralign">фио</td>'+
            '</tr>';
            let emptysign = '<tr class="spantext">'+
            '<td></td><td class="centeralign"></td><td class="centeralign"></td>'+
            '</tr>';
            let dateoptions = {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
              };
            res.render(__dirname+"/../../../views/pack.hbs",{
                pallet: dataTitle.pallet,
                marka: dataTitle.marka,
                diam: locale.insNumber(dataTitle.diam,1),
                n_s: dataTitle.n_s,
                dat_part: new Intl.DateTimeFormat("ru-RU").format(dataTitle.dat_part),
                dat_sort:  dataTitle.dat_sort!=null ? '<b class=boldtext>'+new Intl.DateTimeFormat("ru-RU",dateoptions).format(dataTitle.dat_sort)+'</b>' : "________________",
                pack_kvo_sort: dataTitle.pack_kvo_sort!=null ? '<b class=boldtext>'+locale.insNumber(dataTitle.pack_kvo_sort,0)+'</b>' : "__________",
                kvo_sort: dataTitle.kvo_sort!=null ? '<b class=boldtext>'+locale.insNumber(dataTitle.kvo_sort,1)+'</b>' : "__________",
                rab_sort: dataTitle.rab_sort!=null ?  dataTitle.rab_sort : "________________",
                master_sort: dataTitle.master_sort!=null ? dataTitle.master_sort : "________________",
                sign_rab_sort: dataTitle.rab_sort!=null ? emptysign : sign,
                sign_master_sort: dataTitle.master_sort!=null ? emptysign : sign,
                dat_dosort: dataTitle.dat_dosort!=null ? '<b class=boldtext>'+new Intl.DateTimeFormat("ru-RU",dateoptions).format(dataTitle.dat_dosort)+'</b>' : "________________",
                pack_kvo_dosort: dataTitle.pack_kvo_dosort!=null ? '<b class=boldtext>'+locale.insNumber(dataTitle.pack_kvo_dosort,0)+'</b>' : "__________",
                kvo_dosort: dataTitle.kvo_dosort!=null ? '<b class=boldtext>'+locale.insNumber(dataTitle.kvo_dosort,1)+'</b>' : "__________",
                rab_dosort: dataTitle.rab_dosort!=null ? dataTitle.rab_dosort : "________________",
                master_dosort: dataTitle.master_dosort!=null ? dataTitle.master_dosort : "________________",
                sign_rab_dosort: dataTitle.rab_dosort!=null ? emptysign : sign,
                sign_master_dosort: dataTitle.master_dosort!=null ? emptysign : sign,
                dat_tpack: dataTitle.dat_tpack!=null ? '<b class=boldtext>'+new Intl.DateTimeFormat("ru-RU",dateoptions).format(dataTitle.dat_tpack)+'</b>' : "________________",
                pack_kvo_tpack: dataTitle.pack_kvo_tpack!=null ? '<b class=boldtext>'+locale.insNumber(dataTitle.pack_kvo_tpack,0)+'</b>' : "__________",
                kvo_tpack: dataTitle.kvo_tpack!=null ? '<b class=boldtext>'+locale.insNumber(dataTitle.kvo_tpack,1)+'</b>' : "__________",
                rab_tpack: dataTitle.rab_tpack!=null ? dataTitle.rab_tpack : "________________",
                master_tpack: dataTitle.master_tpack!=null ? dataTitle.master_tpack : "________________",
                sign_rab_tpack: dataTitle.rab_tpack!=null ? emptysign : sign,
                sign_master_tpack: dataTitle.master_tpack!=null ? emptysign : sign,
                qrdata: getQrCode(dataTitle)
            })
        })
        .catch((error) => {
            console.log('ERROR:', error);
            res.status(500).type('text/plain');
            res.send(error.message);
        })            
    });     
 }
