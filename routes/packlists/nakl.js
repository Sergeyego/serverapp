const warehouse = require("../../odata/warehouse");

let insNumber = function (val, dec){
    if (dec!=0){
        return val!=null ? new Intl.NumberFormat("ru-RU", {style: "decimal", minimumFractionDigits : dec, maximumFractionDigits : dec}).format(val) : "";
    } else {
        return val!=null ? new Intl.NumberFormat("ru-RU", {style: "decimal", minimumFractionDigits : dec }).format(val) : "";
    }
}

let getTable = function(data){
    let sum = 0.0;
    let tbl='<table class="tablestyle" border="1" cellspacing="0" cellpadding="2">';
        tbl+='<tr class="boldtext">'+
            '<td class="centeralign" width=4%>№</td>'+
            '<td class="centeralign" width=30% >Наименование товара</td>'+
            '<td class="centeralign">Партия</td>'+
            '<td class="centeralign">Рецептура/плавка</td>'+
            '<td class="centeralign">Поддон</td>'+
            '<td class="centeralign">Колич., кг</td>'+
        '</tr>';
    for (let i=0; i<data.length; i++){
        tbl+='<tr>'+
            '<td class="leftalign">'+String(i+1)+'</td>'+
            '<td class="leftalign">'+data[i]["Номенклатура"]["Description"]+'</td>'+
            '<td class="leftalign">'+data[i]["ПартияНоменклатуры"]["Description"]+'</td>'+
            '<td class="leftalign">'+data[i]["ПартияНоменклатуры"]["РецептураПлавка"]+'</td>'+
            '<td class="leftalign">'+data[i]["НомерКонтейнера"]+'</td>'+
            '<td class="rightalign">'+insNumber(Number(data[i]["Количество"]),2)+'</td>'+
        '</tr>';
        sum+=Number(data[i]["Количество"]);
    }
    tbl+='<tr>'+
        '<td class="leftalign" colspan="5"><b>Итого</b></td>'+
        '<td class="rightalign">'+insNumber(sum,2)+'</td>'+
    '</tr>';
    tbl+='</table>';
    return tbl;
}

module.exports = function (app) {
    app.use("/packnakl/nakl/:kis/", async (req, res) => {

        const headreq = "Document_усОжидаемаяПриемка?$filter=НомерКИС eq '"+req.params["kis"]+
            "'&$expand=Контрагент,Поклажедатель&$select=Ref_Key,НомерКИС,Date,Контрагент/Description,Поклажедатель/Description";

        const head = await warehouse.sendReq(headreq,"GET");
        if (head.ok && head.object.length){
            try {
                headObj=head.object[0];
                const datareq = "Document_усСтрокаОжидаемойПриемки?$filter=Владелец_Key eq guid'"+headObj["Ref_Key"]+"'"+
                "&$expand=Номенклатура,ПартияНоменклатуры&$select=Number,Номенклатура/Description,ПартияНоменклатуры/Description,"+
                "ПартияНоменклатуры/РецептураПлавка,НомерКонтейнера,Количество&$orderby=Number asc";

                const data = await warehouse.sendReq(datareq,"GET");
                if (data.ok){

                    //res.json(headObj);
                    let date = new Date();
                    date.setTime(Date.parse(headObj["Date"]));
                    const sdate=date.toLocaleDateString('ru-RU',{year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' });

                    res.render(__dirname+"/../../views/nakl.hbs",{
                        barcode: '<img src="/barcode/code128/350.png?data='+headObj["НомерКИС"]+'&height=80" alt="barcode" height="80"></img>',
                        title: "Накладная № "+ headObj["НомерКИС"]+" От "+sdate,
                        head: "Накладная № <b>"+ headObj["НомерКИС"]+"</b> От <b>"+sdate+"</b>",
                        oper: "",
                        to: headObj["Контрагент"]["Description"],
                        from: headObj["Поклажедатель"]["Description"],
                        table: getTable(data.object),
                        passed: "________________",
                        accepted: "________________",
                        dec: "(расшифровка подписи)",
                        drv: true
                    })

                    //res.json(data.object);
                } else {
                    res.status(500).type("text/plain");
                    res.send(data.error);
                }
            } catch (error) {
                res.status(500).type("text/plain");
                res.send(error.message);
            }

        } else {
            if (!head.ok){
                res.status(500).type("text/plain");
                res.send(head.error);
            } else {
                res.send("");  
            }
        }
    });
 }
