const db = require('../../postgres.js');
const fetch = require('node-fetch');
const locale = require('../../locale.js');
const bodyParser = require('body-parser');
const encode = require('html-entities');

let getSiteData = async function () {
    const data = await db.one("select s.url, s.code from site s where s.id=1");
    return data;
}

let getDocData = async function (id_doc) {
    const data = await db.one("select zs.nom_doc, zs.dat_beg, zs.dat_end, "+
        "zs.dat_doc, zs.id_ved, COALESCE(zs.gr_tech_ust,'') as gr_tech_ust, zd.fnam as nazv "+
        "from zvd_sert zs "+
        "inner join zvd_doc zd on zd.id=zs.id_doc "+
        "where zs.id = $1 ",[ Number(id_doc)]);
    return data;
}

let getDocsData = async function () {
    const data = await db.any("select zs.nom_doc, zs.dat_beg, zs.dat_end, "+
        "zs.dat_doc, zs.id_ved, COALESCE(zs.gr_tech_ust,'') as gr_tech_ust, zd.fnam as nazv "+
        "from zvd_sert zs "+
        "inner join zvd_doc zd on zd.id=zs.id_doc "+
        "where COALESCE(zs.dat_end,'3000-01-01')>= $1 ",[ new Date() ]);
    return data;
}

let getElData = async function() {
    const data = await db.any("select e.id as id, coalesce(e.marka_sert, e.marka) as marka, et.snam as vid, "+
        "g.nam as type, pu.nam as suf, d.nam as znam, "+
        "i.nam as iso, a.nam as aws, e.id_pic as id_pol, p.descr as pol, e.katalog as active, "+
        "COALESCE(e.descr,'') as descr, COALESCE(e.descr_spec,'') as descr_spec, COALESCE(e.descr_feature,'') as descr_feature, COALESCE(e.pr2,'') as proc "+
        "from elrtr as e "+
        "inner join el_types as et on e.id_vid=et.id "+
        "inner join gost_types as g on e.id_gost_type=g.id "+
        "inner join purpose as pu on e.id_purpose=pu.id "+
        "inner join denominator as d on e.id_denominator=d.id "+
        "inner join iso_types as i on e.id_iso_type=i.id "+
        "inner join aws_types as a on e.id_aws_type=a.id "+
        "inner join pics as p on e.id_pic=p.id "+
        "where e.katalog = true");
    return data;
}

let getElTu = async function(id_el) {
    const data = await db.any("select nam from zvd_get_tu_var( $1, $2, 4, 1)",[ new Date(), Number(id_el)]);
    return data;
}

let getElAmp = async function(id_el) {
    const data = await db.any("select d.diam, a.bot, a.vert, a.ceil from amp as a "+
                     "inner join diam as d on a.id_diam=d.id "+
                     "where a.id_el = $1 and a.id_var=1 order by d.diam",[Number(id_el)]);
    return data;
}

let getElPlav = async function(id_el) {
    const data = await db.any("select n.nam, e.value from el_plav as e "+
                     "inner join el_plav_nams as n on e.id_plav=n.id "+
                     "where e.id_el = $1 order by e.id_plav",[Number(id_el)]);
    return data;
}

let getElChem = async function(id_el) {
    const data = await db.any("select t.nam, t.sig, c.min, c.max from chem_tu as c "+
                      "inner join chem_tbl as t on t.id=c.id_chem "+
                      "where c.id_el = $1 and c.id_var=1 order by t.sig",[Number(id_el)]);
    return data;
}

let getElMech = async function(id_el) {
    const data = await db.any("select t.nam_html, t.sig_html, m.min, m.max from mech_tu as m "+
                      "inner join mech_tbl as t on t.id=m.id_mech "+
                      "where m.id_el = $1 and m.id_var=1 order by t.nam_html",[Number(id_el)]);
    return data;
}

let getElDiams = async function(id_el) {
    const data = await db.any("select * from( "+
                      "(select d.diam as diam from amp as a "+
                      "inner join diam as d on a.id_diam=d.id "+
                      "where a.id_el = $1) "+
                      "union "+
                      "(select d.diam as diam from cena as c "+
                      "inner join diam as d on c.id_diam=d.id "+
                      "where c.dat=(select max(dat) from cena) and c.id_el = $1 ) "+
                      ") as de order by de.diam",[Number(id_el)]);
    return data;
}

let getElSert = async function(id_el) {
    const data = await db.any("select zs.nom_doc as nam, ze.id_sert as id_sert, '' as diams "+
                        "from zvd_els ze "+
                        "inner join zvd_sert zs on zs.id = ze.id_sert "+
                        "inner join elrtr e on e.id = ze.id_el "+
                        "where COALESCE(zs.dat_end,'3000-01-01')>= $1 and e.katalog = true and ze.id_el = $2 "+
                        "union "+
                        "select zs.nom_doc, ze.id_sert, STRING_AGG(to_char(de.dim,'FM9D0'),'#' ORDER BY de.dim) "+
                        "from zvd_eldim ze "+
                        "inner join zvd_sert zs on zs.id = ze.id_sert "+
                        "inner join dry_els de on de.ide = ze.id_eldr "+
                        "inner join elrtr e on e.id = de.id_el "+
                        "where COALESCE(zs.dat_end,'3000-01-01')>= $1 and e.katalog = true and de.id_el = $2 "+
                        "group by ze.id_sert, zs.nom_doc",[new Date(), Number(id_el)]);
    return data;
}

let sendReq = async function(sitedata, path, method, body){  
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
}

let addDoc = async function (sitedata, data, body){
    const param = {
                'NAME': data.nom_doc,
                'fields[TIP_DOKUMENTA]' : data.nazv, 
                'fields[NACHALO_DEYSTVIYA]' : dateString(data.dat_beg), 
                'fields[KONETS_DEYSTVIYA]' : dateString(data.dat_end),
                'fields[DATA_VYDACHI]' : dateString(data.dat_doc),
                'fields[VEDOMSTVO]' : data.id_ved,
                'fields[GRUPPY_TEKHNICHESKIKH_USTROYSTV]' : data.gr_tech_ust,
    };
    return await sendReq(sitedata, "docs.Element.add?"+queryString(param), "POST", body);
}

let updDoc = async function (sitedata, id, data, clearFile, body){
    const param = {
                'elementId' : id,
                'NAME': data.nom_doc,
                'clearfile' : clearFile,
                'fields[TIP_DOKUMENTA]' : data.nazv, 
                'fields[NACHALO_DEYSTVIYA]' : dateString(data.dat_beg), 
                'fields[KONETS_DEYSTVIYA]' : dateString(data.dat_end),
                'fields[DATA_VYDACHI]' : dateString(data.dat_doc),
                'fields[VEDOMSTVO]' : data.id_ved,
                'fields[GRUPPY_TEKHNICHESKIKH_USTROYSTV]' : data.gr_tech_ust,
    };
    return await sendReq(sitedata, "docs.Element.upd?"+queryString(param), "POST", body);
}

function queryString(params) {
    return Object.keys(params).map((key) => `${key}=${encodeURIComponent(params[key])}`).join('&');
}

function dateString(dat){
    str = '';
    if (dat!= null){
        str= locale.insDate(dat);
    }
    return str;
}

function simbEq(kis, data){
    return (kis==encode.decode(data)) || (kis=='-' && data=='');
}

function lenEq(kis, data){
    let eq=false;
    if (data){
        eq = (kis.length==data.length);
    } else {
        eq=(kis.length==0);
    }
    return eq;
}

function elEqual(kis,data,tu,amp,plav,chem,mech,diams,sert,mapDoc){
    let proc='';
    const sp=String(kis.proc).split(':');
    if (sp.length==4){
        proc=sp[0]+"±"+sp[1]+"°C "+sp[2]+" "+sp[3];
    }

    eq=(kis.marka==encode.decode(data['NAME']) &&
        ((kis.active && (data['ACTIVE']=='Y'))||(!kis.active && (data['ACTIVE']=='N'))) &&
        kis.vid==encode.decode(data['NAZNACHENIE']) &&
        simbEq(kis.type,data['TIP_PO_GOST']) &&
        simbEq(kis.suf,data['SUFFIKS']) &&
        simbEq(kis.znam,data['ZNAMENATEL']) &&
        simbEq(kis.iso,data['TIP_PO_ISO']) &&
        simbEq(kis.aws,data['TIP_PO_AWS']) &&
        kis.id_pol==data['POLOZHENIE_PRI_SVARKE'] &&
        kis.descr==encode.decode(data['OPISANIE']) &&
        kis.descr_spec==encode.decode(data['OSOBYE_SVOYSTVA']) &&
        kis.descr_feature==encode.decode(data['TEKHNOLOGICHESKIE_OSOBENNOSTI_SVARKI']) &&
        proc==encode.decode(data['PROKALKA_PERED_SVARKOY']) &&
        kis.marka==encode.decode(data['NAZVANIE']) &&
        data['KHIMICHESKIY_SOSTAV_PROVOLOKI']==false &&
        data['TIP_PROVOLOKI']=='' &&
        data['BAZOVAYA_MARKA']==''
    );

    let tuEq=eq && lenEq(tu,data['NORMATIVNAYA_DOKUMENTATSIYA']);
    if (tuEq){
        for (let i=0; i<tu.length; i++){
            tuEq=tuEq && (tu[i].nam==encode.decode(data['NORMATIVNAYA_DOKUMENTATSIYA'][i]));
            //console.log(data['NORMATIVNAYA_DOKUMENTATSIYA'][i],tu[i].nam);
        }
    }

    let ampEq=eq && lenEq(amp,data['REKOMENDUEMOE_ZNACHENIE_TOKA']);
    if (ampEq){
        for (let i=0; i<amp.length; i++){
            const str=locale.insNumber(amp[i].diam,1)+"#"+amp[i].bot+"#"+amp[i].vert+"#"+amp[i].ceil+"#";
            ampEq=ampEq && (str==encode.decode(data['REKOMENDUEMOE_ZNACHENIE_TOKA'][i]));
            //console.log(data['REKOMENDUEMOE_ZNACHENIE_TOKA'][i],str);
        }
    }

    let plavEq=eq && lenEq(plav,data['KHARAKTERISTIKI_PLAVLENIYA']);
    if (plavEq){
        for (let i=0; i<plav.length; i++){
            const str=plav[i].nam+"#"+locale.insNumber(plav[i].value,1)+"#";
            plavEq=plavEq && (str==encode.decodeEntity(data['KHARAKTERISTIKI_PLAVLENIYA'][i]));
            //console.log(data['KHARAKTERISTIKI_PLAVLENIYA'][i],str);
        }
    }

    let chemEq=eq && lenEq(chem,data['KHIMICHESKIY_SOSTAV_NAPLAVLENNOGO_METALLA']);
    if (chemEq){
        for (let i=0; i<chem.length; i++){
            let min=(chem[i].min==null)? '' : locale.insNumber(chem[i].min,3);
            let max=(chem[i].max==null)? '' : locale.insNumber(chem[i].max,3);
            const str=chem[i].nam+"#"+chem[i].sig+"#"+min+" - "+max+"#";
            chemEq=chemEq && (str==encode.decode(data['KHIMICHESKIY_SOSTAV_NAPLAVLENNOGO_METALLA'][i]));
            //console.log(data['KHIMICHESKIY_SOSTAV_NAPLAVLENNOGO_METALLA'][i],str);
        }
    }

    let mechEq=eq && lenEq(mech,data['MEKHANICHESKIE_SVOYSTVA_METALLA_SHVA_I_NAPLAVLENNO']);
    if (mechEq){
        for (let i=0; i<mech.length; i++){
            let val='';
            if (mech[i].min==null && mech[i].max!=null){
                val="<= "+locale.insNumber(mech[i].max,3);
            } else if (mech[i].max==null && mech[i].min!=null){
                val=">= "+locale.insNumber(mech[i].min,3);
            } else if (mech[i].max!=null && mech[i].min!=null) {
                val=locale.insNumber(mech[i].min,3)+" - "+locale.insNumber(mech[i].max,3);
            }
            const str=encode.decode(mech[i].nam_html+"#"+mech[i].sig_html+"#"+val+"#");
            mechEq=mechEq && (str==encode.decode(data['MEKHANICHESKIE_SVOYSTVA_METALLA_SHVA_I_NAPLAVLENNO'][i]));
            //console.log(encode.decode(data['MEKHANICHESKIE_SVOYSTVA_METALLA_SHVA_I_NAPLAVLENNO'][i]),str);
        }
    }

    let diamsEq=eq && lenEq(diams,data['DIAMETER']);
    if (diamsEq){
        for (let i=0; i<diams.length; i++){
            diamsEq=diamsEq && (locale.insNumber(diams[i].diam,1)==encode.decode(data['DIAMETER'][i]));
            //console.log(data['DIAMETER'][i],locale.insNumber(diams[i].diam,1));
        }
    }

    let sertEq = eq && lenEq(sert,data['DOC']['VALUE']);
    if (sertEq && data['DOC']['VALUE']){
        let map = new Map();
        for (let i=0; i<data['DOC']['VALUE'].length; i++){
            map.set(data['DOC']['VALUE'][i],data['DOC']['DESCRIPTION'][i]);
        }
        //console.log(map);

        for (let i=0; i<sert.length; i++){
            const id_sert=mapDoc.get(sert[i].nam)['ID'];
            let descr=sert[i].diams;
            if (!descr.length){                
                for (let j=0; j<diams.length; j++){
                    if (descr.length){
                        descr+="#";
                    }
                    descr+=locale.insNumber(diams[j].diam,1);
                }
                //console.log(descr);
            }

            sertEq=sertEq && map.has(id_sert) && (descr==map.get(id_sert));
            if (!sertEq){
                console.log(map.has(id_sert),map.get(id_sert),descr);
            } else {
                console.log("ok");
            }
        }
    } else {
        //console.log(data['DOC']['VALUE'].length,sert.length);
    }

    return eq && tuEq && ampEq && plavEq && chemEq && mechEq && diamsEq;
}

let syncEl = async function (sitedata, data, mapDoc){
    const kis=await getElData();
    for (let i=0; i<kis.length; i++){
        const tu = await getElTu(kis[i].id);
        const amp = await getElAmp(kis[i].id);
        const plav = await getElPlav(kis[i].id);
        const chem = await getElChem(kis[i].id);
        const mech = await getElMech(kis[i].id);
        const diams = await getElDiams(kis[i].id);
        const sert = await getElSert(kis[i].id);
        if (data.has(kis[i].id)){
            if (!elEqual(kis[i],data.get(kis[i].id),tu,amp,plav,chem,mech,diams,sert,mapDoc)){
                //обновить
                console.log("for update:"+kis[i].marka+" id="+kis[i].id);
            }
        } else {
            //добавить
            console.log("not exist:"+kis[i].marka+" id="+kis[i].id);
        }
    }
    
    return kis;
}

module.exports = function (app) {

    app.get("/site/sync", async (req, res) => {
        try {
            reqCount=0;
            const sitedata = await getSiteData();

            //сиинхронизация сертификатов
            const dat = await sendReq(sitedata,"docs.Element.listall","GET");
            if (dat.ok){
                let map = new Map();
                if (dat.ok){
                    dat.object.forEach(function(table) {
                        map.set(table['NAME'],table);
                    });
                }
                const data = await getDocsData();
                //console.log(data.length);

                for (let i=0; i<data.length; i++){
                    if (map.has(data[i].nom_doc)){
                        siteDoc=map.get(data[i].nom_doc);
                        if (!(data[i].nazv==encode.decode(siteDoc['TIP_DOKUMENTA']) && 
                                data[i].gr_tech_ust==encode.decode(siteDoc['GRUPPY_TEKHNICHESKIKH_USTROYSTV']) &&
                                data[i].id_ved==siteDoc['VEDOMSTVO'] &&
                                dateString(data[i].dat_beg)==siteDoc['NACHALO_DEYSTVIYA'] &&
                                dateString(data[i].dat_end)==siteDoc['KONETS_DEYSTVIYA'] &&
                                dateString(data[i].dat_doc)==siteDoc['DATA_VYDACHI'])
                        ){
                            upd = await updDoc(sitedata,siteDoc['ID'],data[i],false,"");
                            if (upd.ok){
                                map.set(data[i].nom_doc,upd.object);
                                reqCount++;
                            }
                        }
                    } else {
                        const add = await addDoc(sitedata,data[i],"");
                        if (add.ok){
                            map.set(data[i].nom_doc,add.object);
                            reqCount++;
                        }
                    }
                }

                //синхронизация каталока продукции
                const cat = await sendReq(sitedata,"catalog.Element.listall","GET");
                if (cat.ok){
                    let mapEl = new Map();
                    let mapWire = new Map();
                    cat.object.forEach(function(el) {
                        if (el['CATALOG']=="Каталог электродов"){
                            mapEl.set(Number(el['XML_ID']),el);
                        } else if (el['CATALOG']=="Каталог проволоки"){
                            mapWire.set(Number(el['XML_ID']),el);
                        }
                    });
                    const e = await syncEl(sitedata,mapEl,map);

                    console.log(mapEl);
                    console.log(mapWire);
                }

                res.type("text/plain");
                res.send("Обновлено объектов: "+reqCount);
            } else {
                res.status(500).type("text/plain");
                res.send(dat.error);
            }
        } catch (error) { 
            res.status(500).type("text/plain");
            res.send(error.message);
        }
    })

    app.get("/site/docs/list", async (req, res) => {
        try {
            const sitedata = await getSiteData();
            const dat = await sendReq(sitedata,"docs.Element.listall","GET");
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

    app.post("/site/docs/upd",bodyParser.raw({ type: 'application/pdf', limit: '10mb'}) ,async (req, res) => {
        try {
            const sitedata = await getSiteData();
            const doc = await getDocData(req.query.id);
            const upd = await updDoc(sitedata,req.query.elementId,doc,true,req.body);
            if (upd.ok){
                res.json(upd.object);
            } else {
                res.status(500).type("text/plain");
                res.send(upd.error);
            }
        } catch(error) {
            res.status(500).type("text/plain");
            res.send(error.message);
        }
    })

    app.post("/site/docs/add",bodyParser.raw({ type: 'application/pdf', limit: '10mb'}) ,async (req, res) => {
        try {
            const sitedata = await getSiteData();
            const doc = await getDocData(req.query.id);
            const add = await addDoc(sitedata,doc,req.body);
            if (add.ok){
                res.json(add.object);
            } else {
                res.status(500).type("text/plain");
                res.send(add.error);
            }
        } catch(error) {
            res.status(500).type("text/plain");
            res.send(error.message);
        }
    })
}