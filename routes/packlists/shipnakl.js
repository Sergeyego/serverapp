const db = require('../../postgres.js');
const locale = require('../../locale.js');

let getTable = function(dataEl, dataWire){
    let sum = 0.0;
    let n=1;
    let tbl='<table class="tablestyle" border="1" cellspacing="0" cellpadding="2">';
        tbl+='<tr class="boldtext">'+
            '<td class="centeralign" width=5%>№</td>'+
            '<td class="centeralign" width=30% >Наименование товара</td>'+
            '<td class="centeralign" width=15% >Партия</td>'+
            '<td class="centeralign">Рецептура/плавка</td>'+
            '<td class="centeralign">Колич., кг</td>'+
        '</tr>';
    for (let i=0; i<dataEl.length; i++){
        tbl+='<tr>'+
            '<td class="leftalign">'+String(n)+'</td>'+
            '<td class="leftalign">'+dataEl[i].marka+'</td>'+
            '<td class="leftalign">'+dataEl[i].part+'</td>'+
            '<td class="leftalign">'+(dataEl[i].rec!=null ? dataEl[i].rec : '')+'</td>'+
            '<td class="rightalign">'+locale.insNumber(Number(dataEl[i].kvo),2)+'</td>'+
        '</tr>';
        sum+=Number(dataEl[i].kvo);
        n++;
    }
    for (let i=0; i<dataWire.length; i++){
        tbl+='<tr>'+
            '<td class="leftalign">'+String(n)+'</td>'+
            '<td class="leftalign">'+dataWire[i].marka+'</td>'+
            '<td class="leftalign">'+dataWire[i].part+'</td>'+
            '<td class="leftalign">'+(dataWire[i].rec!=null ? dataWire[i].rec : '')+'</td>'+
            '<td class="rightalign">'+locale.insNumber(Number(dataWire[i].kvo),2)+'</td>'+
        '</tr>';
        sum+=Number(dataWire[i].kvo);
        n++;
    }
    tbl+='<tr>'+
        '<td class="leftalign" colspan="4"><b>Итого</b></td>'+
        '<td class="rightalign">'+locale.insNumber(sum,2)+'</td>'+
    '</tr>';
    tbl+='</table>';
    return tbl;
}

module.exports = function (app) {
    app.use("/packnakl/shipnakl/:id_ship/", async (req, res) => {
        db.one("select st.prefix||date_part('year',sp.dat_vid)||'-'||sp.nom_s as nomer, sp.dat_vid as date, p.naim as pol "+
            "from ship_plan sp "+
            "inner join sert_type st on st.id = sp.id_type "+
            "inner join poluch p on p.id = sp.id_pol "+
            "where sp.id = $1 "
        ,[ Number(req.params["id_ship"])])
        .then((dataTitle) => {            
            db.any("select e.marka ||' ф '|| cast(p.diam as varchar(3)) as marka, p.n_s ||'-'||date_part('year',p.dat_part) as part, rn.nam as rec, spe.massa as kvo "+
                "from ship_plan_el spe "+
                "inner join parti p on p.id = spe.id_part "+
                "inner join elrtr e on e.id = p.id_el "+
                "left join rcp_nam rn on rn.id = p.id_rcp "+
                "where spe.id_sert = $1 "+
                "order by spe.id"
            ,[ Number(req.params["id_ship"])])
            .then((dataEl) => {
                db.any("select p2.nam ||' ф '||cast(d.diam as varchar(3))||' '||wpk.short as marka, wpm.n_s||'-'||date_part('year',wpm.dat) as part, pb.n_plav as rec, spw.m_netto as kvo "+
                    "from ship_plan_wire spw "+
                    "inner join wire_parti wp on wp.id = spw.id_wparti "+
                    "inner join wire_parti_m wpm on wpm.id = wp.id_m "+
                    "inner join provol p2 on p2.id = wpm.id_provol "+
                    "inner join diam d on d.id = wpm.id_diam "+
                    "inner join prov_buht pb on pb.id = wpm.id_buht "+
                    "inner join wire_pack_kind wpk on wpk.id = wp.id_pack "+
                    "where spw.id_ship = $1 "+
                    "order by spw.id"
                ,[ Number(req.params["id_ship"])])
                .then((dataWire) => {
                    const sdate=dataTitle.date.toLocaleDateString('ru-RU',{year: 'numeric', month: 'numeric', day: 'numeric'});
                    res.render(__dirname+"/../../views/nakl.hbs",{
                        barcode: '<img src="/barcode/code128/350.png?data='+dataTitle.nomer+'&height=80" alt="barcode" height="80"></img>',
                        title: "Накладная № "+dataTitle.nomer+" От "+sdate,
                        head: "Накладная № <b>"+dataTitle.nomer+"</b> От <b>"+sdate+"</b>",
                        oper: "",
                        to: dataTitle.pol,
                        from: "Склад готовой продукции",
                        table: getTable(dataEl, dataWire),
                        passed: "________________",
                        accepted: "________________",
                        dec: "(расшифровка подписи)",
                        drv: true
                    })
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
        .catch((error) => {
            console.log('ERROR:', error);
            res.status(500).type('text/plain');
            res.send(error.message);
        }) 
    });     
}
