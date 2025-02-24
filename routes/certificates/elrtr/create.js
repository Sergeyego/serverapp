const srt = require("../srt");
const qr = require("../../qrcode/qr");
const translit = require("cyrillic-to-translit-js");

let getMainTbl = function(lang, headerdata, id_type, tudata, intdata) {
    let symb="";
    if (id_type==5){
        symb=(headerdata.gt=="-" || headerdata.pu=="-") ? 
            srt.insText(lang,headerdata.marka,translit().transform(headerdata.marka))+"-∅"+srt.insNumber(lang,headerdata.diam,0)
        : 
            headerdata.gt+"-"+headerdata.pu;
    } else {
        symb=(headerdata.gt=="-" || headerdata.pu=="-") ? 
        srt.insText(lang,headerdata.marka,translit().transform(headerdata.marka))+"-∅"+srt.insNumber(lang,headerdata.diam,0)
        : 
        srt.insText(lang,headerdata.gt,translit().transform(headerdata.gt))+"-"+srt.insText(lang,headerdata.marka,translit().transform(headerdata.marka))+"-∅"+srt.insNumber(lang,headerdata.diam,0)+"-"+srt.insText(lang,headerdata.pu,translit().transform(headerdata.pu));
    }
    if (headerdata.znam!=null && headerdata.znam!="" && headerdata.znam!="-"){
        symb+="<br>"+srt.insText(lang,headerdata.znam,translit().transform(headerdata.znam));
    }

    let goststr="";
    for (let i = 0; i < tudata.length; i++) {
        if (tudata[i].nam.indexOf("ГОСТ")==0){
            if (goststr!=""){
                goststr+="<br>";
            }
            goststr+=tudata[i].nam;
        }
    }

    let tbl;
    let dat = (id_type!=1) ? headerdata.dat : new Date(1111,10,11);
    let n_s = (id_type!=1) ? headerdata.n_s : "1111";
    let massa = (id_type!=1) ? headerdata.massa : 1111.0;
    if (id_type==5){
        tbl='<table class="tablestyle" border="1" cellspacing="1" cellpadding="3">'+
                '<tr class="boldtext">'+
                    '<td class="centeralign" rowspan="2" width="120">'+srt.insText(lang,"Наименование продукции","Product designation",true)+'</td>'+
                    '<td class="centeralign" colspan="'+String(1+intdata.length)+'">'+srt.insText(lang,"Классификация","Classification",true)+'</td>'+
                    '<td class="centeralign" rowspan="2">'+srt.insText(lang,"Проволока по ГОСТ&nbsp;2246-70","Wire <br>according to GOST&nbsp;2246-70",true)+'</td>'+
                    '<td class="centeralign" rowspan="2">'+srt.insText(lang,"Номер партии","Batch number",true)+'</td>'+
                    '<td class="centeralign" rowspan="2">'+srt.insText(lang,"Дата производства","Date of manufacture",true)+'</td>'+
                    '<td class="centeralign" rowspan="2">'+srt.insText(lang,"Масса электродов нетто, кг","Net weight, kg",true)+'</td>'+
                '</tr>'+
                '<tr>'+
                    '<td class="centeralign" width="150">'+srt.insText(lang,goststr,translit().transform(goststr))+'</td>';
                for (let i=0; i<intdata.length; i++){
                    tbl+='<td class="centeralign" width="100">'+intdata[i].nam+'</td>';
                }
        tbl+='</tr>'+
                '<tr>'+
                    '<td class="centeralign">'+srt.insText(lang,headerdata.marka,translit().transform(headerdata.marka))+"-∅"+srt.insNumber(lang,headerdata.diam,0)+'</td>'+
                    '<td class="centeralign">'+symb+'</td>';
                    for (let i=0; i<intdata.length; i++){
                        tbl+='<td class="centeralign">'+intdata[i].val+'</td>';
                    }
                    tbl+='<td class="centeralign">'+srt.insText(lang,headerdata.provol,translit().transform(headerdata.provol))+'</td>'+
                    '<td class="centeralign">'+n_s+'</td>'+
                    '<td class="centeralign">'+srt.insDate(lang,dat,true)+'</td>'+
                    '<td class="centeralign">'+srt.insNumber(lang,massa,1)+'</td>'+
                '</tr>'+
            '</table>';
    } else {
        tbl='<table class="tablestyle" border="1" cellspacing="1" cellpadding="3">'+
                '<tr class="boldtext">'+
                    '<td width="300" class="centeralign">'+srt.insText(lang,"Условное обозначение электрода","Electrode symbol",true)+'</td>'+
                    '<td class="centeralign">'+srt.insText(lang,"Проволока по ГОСТ&nbsp;2246-70","Wire <br>according to GOST&nbsp;2246-70",true)+'</td>'+
                    '<td class="centeralign">'+srt.insText(lang,"Номер партии","Batch number",true)+'</td>'+
                    '<td class="centeralign">'+srt.insText(lang,"Дата производства","Date of manufacture",true)+'</td>'+
                    '<td class="centeralign">'+srt.insText(lang,"Масса электродов нетто, кг","Net weight, kg",true)+'</td>'+
                '</tr>'+
                '<tr>'+
                    '<td class="centeralign">'+symb+'</td>'+
                    '<td class="centeralign">'+srt.insText(lang,headerdata.provol,translit().transform(headerdata.provol))+'</td>'+
                    '<td class="centeralign">'+n_s+'</td>'+
                    '<td class="centeralign">'+srt.insDate(lang,dat,true)+'</td>'+
                    '<td class="centeralign">'+srt.insNumber(lang,massa,1)+'</td>'+
                '</tr>'+
            '</table>';
    }
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
    return "/qrcode/300.png?data="+qr.encodeBase64Url(Buffer.from(code));
}

module.exports = function (app) {
    const data = require("./data.js");
    app.use("/certificates/elrtr/:id_type/:id", async (req, res) => {
        let id = Number(req.params["id"]);
        let lang = req.query.lang;
        let setSert = new Set();
        let is_ship = (typeof req.query.part=="undefined" || req.query.part=="false");
        let id_type = Number(req.params["id_type"]);
        let ennum = (id_type==3 || id_type==4)? "3.2" : "3.1";
        let enru = "Испытания: согласно EN 10204 - "+ennum+".";
        let enen = "Tests: according to EN 10204 - "+ennum+".";
        data.getHeaderData(id,is_ship)
        .then((headerdata)=>{
            let id_part = headerdata.id;
            srt.getGeneralData(headerdata.datvid)
            .then((gendata)=>{
                data.getTuData(id_part)
                .then((tudata)=>{
                    data.getChemData(id_part)
                    .then((chemdata)=>{
                        data.getMechData(id_part)
                        .then((mechdata)=>{
                            data.getSertData(id_part)
                            .then((sertdata)=>{
                                data.getIntData(id_part)
                                .then((intdata)=>{
                                    if (typeof req.query.docs!="undefined"){
                                        if (req.query.docs!=""){
                                            const arr = String(req.query.docs).split("|");
                                            for (let i=0; i<arr.length; i++){
                                                setSert.add(Number(arr[i]));
                                            }
                                        }
                                    } else {
                                        for (let i=0; i<sertdata.length; i++){
                                            if (sertdata[i].en==true){
                                                setSert.add(sertdata[i].id_doc);
                                            }
                                        }
                                    }

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
                                        if (id_type!=1){
                                            pol=srt.insText(lang,headerdata.pol,headerdata.pol_en);
                                        }
                                    }

                                    let chemtitle = srt.insText(lang,enru+" Химический состав наплавленного металла, %",enen+" Chemical composition of weld metal, %",true);
                                                                    
                                    res.render(__dirname+"/../../../views/cert.hbs",{
                                        header: head, 
                                        adr: srt.insText(lang,gendata.adr,gendata.adr_en,true), 
                                        tel: gendata.tel,
                                        fnam: srt.insText(lang,gendata.fnam,gendata.fnam_en,false),
                                        tutitle: srt.insText(lang,"Нормативная документация","Normative documents",false)+": ",
                                        tustr: srt.insText(lang,tustr,translit().transform(tustr),false),
                                        maintbl: getMainTbl(lang,headerdata,id_type,tudata,intdata),
                                        chemtbl: srt.getChemTbl(lang,chemtitle,chemdata),
                                        mechtbl: srt.getMechTbl(lang,enru,enen,mechdata),
                                        srtheader: setSert.size ? srt.insText(lang,"Аттестация и сертификация","Certification",false) : "",
                                        serttbl: srt.getSertTbl(lang,sertdata,setSert),
                                        sertpic: srt.getSertPic(sertdata,setSert),
                                        sertapp: srt.getSertApp(lang,sertdata,setSert),
                                        poltitle: poltitle,
                                        pol: pol,
                                        note: srt.insText(lang,"При переписке по вопросам качества просьба ссылаться на номер партии","When correspondence on quality issues, please refer to the batch number",true),
                                        constitle: srt.insText(lang,"Заключение","Conclusion",false)+":",
                                        cons: srt.insText(lang,"соответствует требованиям "+tustr,"meets the requirements of "+translit().transform(tustr),true),
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