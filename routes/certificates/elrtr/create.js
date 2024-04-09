module.exports = function (app) {
    const data = require("./data.js");
    const srt = require("../srt");
    app.use("/certificates/elrtr/:Id", async (req, res) => {
        let id = Number(req.params["Id"]);
        let lang=req.query.lang;
        let is_ship=(typeof req.query.part=="undefined" || req.query.part=="false");
        data.getHeaderData(id,is_ship)
        .then((headerdata)=>{
            let id_part = headerdata.id;
            srt.getGeneralData(headerdata.dat)
            .then((gendata)=>{
                data.getTuData(id_part)
                .then((tudata)=>{
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
                    res.render("template.hbs",{
                        header: head, 
                        adr: srt.insText(lang,gendata.adr,gendata.adr_en,true), 
                        tel: gendata.tel,
                        tutitle: srt.insText(lang,"Нормативная документация","Normative documents",false)+": ",
                        tustr: tustr
                    }/*, helpers: {
                        getDate: function() {
                            let date = new Date();
                            
                            let year  = date.getFullYear();
                            let month = date.getMonth() + 1;
                            let day   = date.getDate();
                            
                            return year + '-' + month + '-' + day;
                        }
                    }*/);
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