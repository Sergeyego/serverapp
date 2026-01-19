const db = require('../../postgres.js');
const fetch = require('node-fetch');
const locale = require('../../locale.js');
const bodyParser = require('body-parser');

let getSiteData = async function () {
    const data = await db.one("select s.url, s.code from site s where s.id=1");
    return data;
}

let getDocData = async function (id_doc) {
    const data = await db.one("select zs.nom_doc, zs.dat_beg, zs.dat_end, "+
        "zs.dat_doc, zs.id_ved, zs.gr_tech_ust, zs.nazv "+
        "from zvd_sert zs where id = $1 ",[ Number(id_doc)]);
    return data;
}

let sendReq = async function(path, method, body){

    try {
        const sitedata = await getSiteData();

        let err="";
        let  ok=false;
        let data;

        const headers = new fetch.Headers({
            "Accept" : "application/json",
            "Accept-Charset" : "UTF-8",
            "User-Agent" : "Appszsm",
            "Cookie" : "beget=begetok",
            "Content-Type" : "application/pdf",
        });
        
        let url=sitedata.url+'/rest/3/'+sitedata.code+'/'+path;
        
        let response = await fetch(url,{
            method: method,
            headers,
            body: body,
        });

        if (response.headers.get('Content-Type').indexOf('application/json')>=0){
            let jsonObj = await response.json();
            if (response.ok) {
                data = jsonObj['result'];                
                ok=true;
            } else {              
                err=jsonObj['error_description'];
            }
        } else {
            err = await response.text();
        }
        return {object: data, error: err, ok: ok};
    } catch (error) { 
        return {object: "", error: error.message, ok: false};
    }
}

function queryString(params) {
  return Object.keys(params).map((key) => `${key}=${encodeURIComponent(params[key])}`).join('&');
}

module.exports = function (app) {
    app.get("/site/docs/list", async (req, res) => {
        const dat = await sendReq("docs.Element.listall","GET");
        if (dat.ok){
            res.json(dat.object);
        } else {
            res.status(500).type("text/plain");
            res.send(dat.error);
        }
    })

    app.post("/site/docs/upd",bodyParser.raw({ type: 'application/pdf', limit: '10mb'}) ,async (req, res) => {
        try {
            const doc = await getDocData(req.query.id);
            const param = {
                'elementId' : req.query.elementId,
                'NAME': doc.nom_doc,
                'fields[TIP_DOKUMENTA]' : doc.nazv, 
                'fields[NACHALO_DEYSTVIYA]' : locale.insDate(doc.dat_beg), 
                'fields[KONETS_DEYSTVIYA]' : locale.insDate(doc.dat_end),
                'fields[DATA_VYDACHI]' : locale.insDate(doc.dat_doc),
                'fields[VEDOMSTVO]' : doc.id_ved,
                'fields[GRUPPY_TEKHNICHESKIKH_USTROYSTV]' : doc.gr_tech_ust,
            };
            const dat = await sendReq("docs.Element.upd?"+queryString(param),"POST", req.body);
            if (dat.ok){
                res.json(dat.object);
            } else {
                res.status(500).type("text/plain");
                res.send(dat.error);
            }
        } catch(error) {
            res.status(500).type("text/plain");
            res.send(error.message);
        }
    })
}