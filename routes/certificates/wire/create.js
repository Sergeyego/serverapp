const srt = require("../srt");
const qr = require("../../qrcode/qr");

let getMainTbl = function(lang, headerdata, id_type) {
    let tbl;
    let dat = (id_type!=1) ? headerdata.dat : new Date(1111,10,11);
    let n_s = (id_type!=1) ? headerdata.n_s : "1111";
    let massa = (id_type!=1) ? headerdata.massa : 1111.0;
    tbl='<table class="tablestyle" border="1" cellspacing="1" cellpadding="3">'+
            '<tr class="boldtext">'+
                '<td width="130" class="centeralign">'+srt.insText(lang,"Марка проволоки","Wire mark",true)+'</td>'+
                '<td width="140" class="centeralign">'+srt.insText(lang,"Условное обозначение проволоки","Wire symbol",true)+'</td>'+
                '<td class="centeralign">'+srt.insText(lang,"Тип носителя проволоки","Type of wire winding",true)+'</td>'+
                '<td class="centeralign">'+srt.insText(lang,"Номер плавки","Heat number",true)+'</td>'+
                '<td class="centeralign">'+srt.insText(lang,"Номер партии","Batch number",true)+'</td>'+
                '<td class="centeralign">'+srt.insText(lang,"Дата производства","Date of manufacture",true)+'</td>'+
                '<td class="centeralign">'+srt.insText(lang,"Масса проволоки нетто, кг","Net weight, kg",true)+'</td>'+
            '</tr>'+
            '<tr>'+
                '<td class="centeralign">'+headerdata.bprov+'</td>'+
                '<td class="centeralign">'+srt.insNumber(lang,headerdata.diam,1)+" "+headerdata.prov+'</td>'+
                '<td class="centeralign">'+srt.insText(lang,headerdata.spool,headerdata.spool_en,true)+'</td>'+
                '<td class="centeralign">'+headerdata.nplav+'</td>'+
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
    code+="Марка проволоки "+headerdata.bprov+"\n";
    code+="Условное обозначение проволоки "+srt.insNumber("ru",headerdata.diam,1)+" "+headerdata.prov+"\n";
    code+="Тип носителя проволоки "+headerdata.spool+"\n";
    code+="Номер плавки "+headerdata.nplav+"\n";
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
    app.use("/certificates/wire/:id_type/:id", async (req, res) => {
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

                                let footer = srt.insText(lang,"Состояние поверхности проволоки: поверхность проволоки чистая, "+
                                    "гладкая, без трещин, расслоений, плен, закатов, раковин, забоин "+
                                    "окалины, ржавчины, масла, технологической смазки и других загрязнений.<br>"+
                                    "Гарантийный срок хранения сварочной проволоки в упаковке производителя - 12 месяцев с момента изготовления.",
                                    "The condition of the surface of the wire: the surface of the wire is clean, smooth, without cracks, delaminations, "+
                                    "slivers, laps, shells, nicks, scale, rust, oil, grease and other contaminants.<br>"+
                                    "The guaranteed shelf life of the welding wire in the manufacturer's packaging is 12 months from the date of manufacture.",true);

                                let chemtitle = srt.insText(lang,enru+" Химический состав проволоки, %",enen+" The chemical composition of the wire, %",true);
                                                                
                                res.render(__dirname+"/../../../views/cert.hbs",{
                                    header: head, 
                                    adr: srt.insText(lang,gendata.adr,gendata.adr_en,true), 
                                    tel: gendata.tel,
                                    tutitle: srt.insText(lang,"Нормативная документация","Normative documents",false)+": ",
                                    tustr: tustr,
                                    maintbl: getMainTbl(lang,headerdata,id_type),
                                    chemtbl: srt.getChemTbl(lang,chemtitle,chemdata),
                                    mechtbl: srt.getMechTbl(lang,enru,enen,mechdata,footer),
                                    srtheader: setSert.size ? srt.insText(lang,"Аттестация и сертификация","Certification",false) : "",
                                    serttbl: srt.getSertTbl(lang,sertdata,setSert),
                                    sertpic: srt.getSertPic(sertdata,setSert),
                                    sertapp: srt.getSertApp(lang,sertdata,setSert),
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

    app.get("/wire/sertdata/:id", async (req, res) => {
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