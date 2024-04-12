const srt = require("../srt");
const qr = require("../../qrcode/qr");

let getMainTbl = function(lang, headerdata, id_type) {
    let symb=(headerdata.gt=="-" || headerdata.pu=="-") ? 
            headerdata.marka+"-∅"+srt.insNumber(lang,headerdata.diam,0)
        : 
            headerdata.gt+"-"+headerdata.marka+"-∅"+srt.insNumber(lang,headerdata.diam,0)+"-"+headerdata.pu;
    if (headerdata.znam!=null && headerdata.znam!="" && headerdata.znam!="-"){
        symb+="<br>"+headerdata.znam;
    }
    let tbl;
    let dat = (id_type!=1) ? headerdata.dat : new Date(1111,10,11);
    let n_s = (id_type!=1) ? headerdata.n_s : "1111";
    let massa = (id_type!=1) ? headerdata.massa : 1111.0;
    tbl='<table class="tablestyle" border="1" cellspacing="1" cellpadding="3">'+
            '<tr class="boldtext">'+
                '<td width="300" class="centeralign">'+srt.insText(lang,"Условное обозначение электрода","Electrode symbol",true)+'</td>'+
                '<td class="centeralign">'+srt.insText(lang,"Проволока по ГОСТ&nbsp;2246-70","Wire <br>according to ГОСТ&nbsp;2246-70",true)+'</td>'+
                '<td class="centeralign">'+srt.insText(lang,"Номер партии","Batch number",true)+'</td>'+
                '<td class="centeralign">'+srt.insText(lang,"Дата производства","Date of manufacture",true)+'</td>'+
                '<td class="centeralign">'+srt.insText(lang,"Масса электродов нетто, кг","Net weight, kg",true)+'</td>'+
            '</tr>'+
            '<tr>'+
                '<td class="centeralign">'+symb+'</td>'+
                '<td class="centeralign">'+headerdata.provol+'</td>'+
                '<td class="centeralign">'+n_s+'</td>'+
                '<td class="centeralign">'+srt.insDate(lang,dat,true)+'</td>'+
                '<td class="centeralign">'+srt.insNumber(lang,massa,1)+'</td>'+
            '</tr>'+
        '</table>';
    return tbl;
}

let getQrCode = function (headerdata, id_type, is_ship){
    let n_s = (id_type!=1) ? headerdata.n_s : "1111";
    let date_pr = (id_type!=1) ? headerdata.dat : new Date(1111,10,11);
    let date = (id_type!=1) ? headerdata.datvid : new Date(1111,10,11);
    let massa = (id_type!=1) ? headerdata.massa : 1111.0;
    let code = (id_type!=1) ? "СЕРТИФИКАТ КАЧЕСТВА №" : "ОБРАЗЕЦ СЕРТИФИКАТА КАЧЕСТВА №";
    code+=n_s+"-"+headerdata.year;
    if (is_ship){
        code+="/"+headerdata.nomer;
    }
    code+="\n";
    code+="Марка "+headerdata.marka+"\n";
    code+="Диаметр, мм "+srt.insNumber("ru",headerdata.diam,0)+"\n";
    code+="Номер партии "+n_s+"\n";
    code+="Дата производства "+srt.insDate("ru",date_pr,false)+"\n";
    code+="Масса нетто, кг "+srt.insNumber("ru",massa,0)+"\n";
    if (is_ship && id_type!=1){
        code+="Грузополучатель: "+headerdata.pol+"\n";
    }
    code+="Дата "+srt.insDate("ru",date,false)+"\n";
    code+="Код подлинности "+headerdata.code;   
    return "/qrcode/qr.png?data="+qr.encodeBase64Url(Buffer.from(code));
}

module.exports = function (app) {
    const data = require("./data.js");
    app.use("/certificates/elrtr/:id_type/:id", async (req, res) => {
        let id = Number(req.params["id"]);
        let lang = req.query.lang;
        let is_ship = (typeof req.query.part=="undefined" || req.query.part=="false");
        let id_type = Number(req.params["id_type"]);
        let ennum = (id_type==3 || id_type==4)? "3.2" : "3.1";
        let enru = "Испытания: согласно EN 10204 - "+ennum+".";
        let enen = "Tests: according to EN 10204 - "+ennum+".";
        data.getHeaderData(id,is_ship)
        .then((headerdata)=>{
            let id_part = headerdata.id;
            srt.getGeneralData(headerdata.dat)
            .then((gendata)=>{
                data.getTuData(id_part)
                .then((tudata)=>{
                    data.getChemData(id_part)
                    .then((chemdata)=>{
                        data.getMechData(id_part)
                        .then((mechdata)=>{
                            data.getSertData(id_part)
                            .then((sertdata)=>{
                                let tustr="";
                                for (let i = 0; i < tudata.length; i++) {
                                    if (tustr!=""){
                                        tustr+=", ";
                                    }
                                    tustr+=tudata[i].nam;
                                }
                                let poltitle = "";
                                let pol = "";
                                let n_s = (id_type!=1) ? headerdata.n_s : "1111";
                                let datvid = (id_type!=1) ? headerdata.datvid : new Date(1111,10,11);

                                let head = srt.insText(lang,"СЕРТИФИКАТ КАЧЕСТВА","QUALITY CERTIFICATE",false);
                                head+=" №"+n_s+"-"+headerdata.year;
                                if (is_ship){
                                    head+="/"+headerdata.nomer;
                                    poltitle=srt.insText(lang,"Грузополучатель","Consignee",false)+":";
                                    pol=srt.insText(lang,headerdata.pol,headerdata.pol_en);
                                }

                                let chemtitle = srt.insText(lang,enru+" Химический состав наплавленного металла, %",enen+" Chemical composition of weld metal, %",true);
                                                                
                                res.render("template.hbs",{
                                    header: head, 
                                    adr: srt.insText(lang,gendata.adr,gendata.adr_en,true), 
                                    tel: gendata.tel,
                                    tutitle: srt.insText(lang,"Нормативная документация","Normative documents",false)+": ",
                                    tustr: tustr,
                                    maintbl: getMainTbl(lang,headerdata,id_type),
                                    chemtbl: srt.getChemTbl(lang,chemtitle,chemdata),
                                    mechtbl: srt.getMechTbl(lang,enru,enen,mechdata),
                                    srtheader: srt.insText(lang,"Аттестация и сертификация","Certification",false),
                                    serttbl: srt.getSertTbl(lang,sertdata),
                                    sertpic: srt.getSertPic(sertdata),
                                    sertapp: srt.getSertApp(lang,sertdata),
                                    poltitle: poltitle,
                                    pol: pol,
                                    note: srt.insText(lang,"При переписке по вопросам качества просьба ссылаться на номер партии","When correspondence on quality issues, please refer to the batch number",true),
                                    constitle: srt.insText(lang,"Заключение","Conclusion",false)+":",
                                    cons: srt.insText(lang,"соответствует требованиям "+tustr,"meets the requirements of "+tustr,true),
                                    dattitle: srt.insText(lang,"Дата выдачи сертификата","Date of issue of the certificate",false)+": ",
                                    dat: srt.insDate(lang,datvid,false),
                                    qrsrc: getQrCode(headerdata,id_type,is_ship),
                                    sign: srt.getSign(lang,id_type,gendata),
                                    back: srt.getBackground(lang,id_type)
                                })
                            })
                            .catch((error) => {
                                console.log("ERROR:", error);
                                res.status(500).type("text/plain");
                                res.send(error.message);
                            })
                        })
                        .catch((error) => {
                            console.log("ERROR:", error);
                            res.status(500).type("text/plain");
                            res.send(error.message);
                        })
                    })
                    .catch((error) => {
                        console.log("ERROR:", error);
                        res.status(500).type("text/plain");
                        res.send(error.message);
                    })
                })
                .catch((error) => {
                    console.log("ERROR:", error);
                    res.status(500).type("text/plain");
                    res.send(error.message);
                })
            })
            .catch((error) => {
                    console.log("ERROR:", error);
                    res.status(500).type("text/plain");
                    res.send(error.message);
            })
        })
        .catch((error) => {
            console.log("ERROR:", error);
            res.status(500).type("text/plain");
            res.send(error.message);
        })       
    })

    app.get("/elrtr/sertdata/:id", async (req, res) => {
        data.getSertData(Number(req.params["id"]))
            .then((sertdata)=>{
                res.json(sertdata);
            })
            .catch((error) => {
                console.log("ERROR:", error);
                res.status(500).type("text/plain");
                res.send(error.message);
            })
    })

}