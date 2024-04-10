const srt = require("../srt");

let getMainTbl = function(lang, headerdata, id_type=1) {
    let symb=(headerdata.gt=="-" || headerdata.pu=="-") ? 
            headerdata.marka+"-∅"+srt.insNumber(lang,headerdata.diam,0)
        : 
            headerdata.gt+"-"+headerdata.marka+"-∅"+srt.insNumber(lang,headerdata.diam,0)+"-"+headerdata.pu;
    if (headerdata.znam!=null && headerdata.znam!="" && headerdata.znam!="-"){
        symb+="<br>"+headerdata.znam;
    }
    let tbl;
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
                '<td class="centeralign">'+headerdata.n_s+'</td>'+
                '<td class="centeralign">'+srt.insDate(lang,headerdata.dat,true)+'</td>'+
                '<td class="centeralign">'+srt.insNumber(lang,headerdata.massa,1)+'</td>'+
            '</tr>'+
        '</table>';
    return tbl;
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

                                let head = srt.insText(lang,"СЕРТИФИКАТ КАЧЕСТВА","QUALITY CERTIFICATE",false);
                                head+=" №"+headerdata.n_s+"-"+headerdata.year;
                                if (is_ship){
                                    head+="/"+headerdata.nomer;
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
                                    serttbl: srt.getSertTbl(lang,sertdata)
                                });
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
    } )
}