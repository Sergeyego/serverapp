const latex = require('node-latex');
const fs = require('fs');
const through = require('through2');
const db = require('../../../postgres.js');
const srtdata = require("../../certificates/elrtr/data.js");
const locale = require('../../../locale.js');
const lescape = require('escape-latex');

let getPartData = async function (id) {
    let query = 
        "select p.id as id, p.n_s as n_s, p.dat_part as dat, e.marka_sert as marka, p.diam as diam, p.kfmp as kfmp, ev.proc as proc, e.shelf_life as warr, "+
        "gt.nam as type, pu.nam as pu, coalesce (p.ibco, ev.znam) as znam, coalesce(pp.nam, pe.nam) as provol, el.nam as long, e.vl as vl, eg.typ as grp, "+
        "get_prod($1) as massa, coalesce(ev.descrtu, ev.descr) as descr, et.okp as okp "+
        "from parti as p "+
        "inner join elrtr as e on e.id=p.id_el "+
        "inner join provol as pe on pe.id=e.id_gost "+
        "left join provol as pp on pp.id=p.id_prfact and pp.id in (select ep.id_prov from el_provol as ep where ep.id_el = p.id_el) "+
        "inner join gost_types as gt on e.id_gost_type=gt.id "+
        "inner join purpose as pu on e.id_purpose=pu.id "+
        "inner join el_long el on el.id=p.id_long "+
        "inner join el_grp eg on eg.id=e.id_grp "+
        "inner join el_types et on et.id=e.id_vid "+
        "left join el_var as ev on ev.id_el = p.id_el and ev.id_var = p.id_var "+
        "where p.id = $1";
    const data = await db.one(query, [ Number(id)] );
    return data;
}

let getSertData = async function (id) {
    let query="select z.doc_nam as doc_nam, zs.nom_doc as nom_doc, zs.dat_beg as dat_beg, "+
        "zs.dat_end as dat_end, zd.iss as iss, zv.iss_f as iss_f "+
        "from zvd_get_sert_var((select dat_part from parti where id = $1 ), "+
        "(select id_el from parti where id = $1 ), "+
        "(select d.id from diam as d where d.diam = (select diam from parti where id = $1 )), "+
        "(select id_var from parti where id = $1 ) ) as z "+
        "inner join zvd_sert zs on zs.id=z.id_doc "+
        "inner join zvd_ved zv on zv.id=zs.id_ved "+
        "inner join zvd_doc zd on zd.id=zs.id_doc "+
        "where z.en=true";
    const data = await db.any(query, [ Number(id)] );
    return data;
}

let getChemData = async function (id) {
    let query="select c.sig as sig, s.value as val, ct.min as min, ct.max as max from sert_chem as s "+
        "inner join chem_tbl c on s.id_chem=c.id "+
        "left join chem_tu ct on ct.id_el = (select id_el from parti where id = $1 ) "+
        "and ct.id_chem = s.id_chem and ct.id_var = (select id_var from parti where id = $1 ) "+
        "where s.id_part = $1 order by c.sig";
    const data = await db.any(query, [ Number(id)] );
    return data;
}

let getMechData = async function (id) {
    let query="select * from ( "+
        "select mc.nam as cat_nam, m.tex as nam, m.prefix as prefix, s.value as val, mt.min as min, mt.max as max "+
        "from sert_mech as s "+
        "inner join mech_tbl as m on s.id_mech=m.id "+
        "inner join mech_category mc on mc.id=m.id_cat "+
        "left join mech_tu mt on mt.id_el = (select id_el from parti where id = $1 ) "+
        "and mt.id_mech = s.id_mech and mt.id_var = (select id_var from parti where id = $1 ) "+
        "where s.id_part = $1 "+
        "union "+
        "select mc2.nam, t.nam, n.nam, null, null, null "+
        "from sert_mechx as x "+
        "inner join mechx_tbl as t on x.id_mechx=t.id "+
        "inner join mechx_nams as n on x.id_value=n.id "+
        "inner join mech_category mc2 on mc2.id=t.id_cat "+
        "where x.id_part = $1 "+
        ") as z order by z.cat_nam, z.nam";
    const data = await db.any(query, [ Number(id)] );
    return data;
}

let getAmpData = async function (id) {
    let query="select at2.lay as lay, p.nam as pol, at2.bot as bot, at2.vert as vert, at2.\"ceil\" as top "+
        "from amp_tu at2 "+
        "inner join polar p on p.id = at2.id_polar "+
        "where at2.id_el = (select id_el from parti where id = $1) "+
        "and at2.id_diam = (select id from diam where diam = (select diam from parti where id = $1)) "+
        "and at2.id_var = (select id_var from parti where id = $1) "+
        "order by at2.id ";
    const data = await db.any(query, [ Number(id)] );
    return data;
}

let getPlavData = async function (id) {
    let query="select epn.nam as nam, ep.value as val from el_plav ep "+
        "inner join el_plav_nams epn on epn.id = ep.id_plav "+
        "where ep.id_el = (select id_el from parti where id = $1) "+
        "order by epn.nam";
    const data = await db.any(query, [ Number(id)] );
    return data;
}

let getFrac = function (partData) {
    let tex = "";
    let znam=partData.znam;
    let type=partData.type;
    let pu=partData.pu;
    let num="";
    if (type!=null && type!='-' && type!=''){
        num+=lescape(type)+'-';
    }
    num+=lescape(partData.marka)+'-⌀'+locale.insNumber(partData.diam,0);
    if (pu!=null && pu!='-' && pu!=''){
        num+='-'+lescape(pu);
    }
    if (znam!=null && znam!='-' && znam!=''){
        tex+="\\frac {\\text{"+num+"}}{\\text{"+znam+"}}";
    } else {
        tex+="\\text{"+num+"}";
    }
    return tex;
}

let getSertStr = function (sertData) {
    let tex = "";
    for (let i=0; i<sertData.length; i++){
        tex+=lescape(sertData[i].doc_nam)+" & № "+lescape(sertData[i].nom_doc);
        tex+=" (срок действия с "+locale.insDate(sertData[i].dat_beg)+" по "+locale.insDate(sertData[i].dat_end)+")";
        if (sertData[i].iss!=null && sertData[i].iss_f!=null){
            tex+=", "+lescape(sertData[i].iss)+" "+lescape(sertData[i].iss_f);
        }
        tex+=" \\\\ \\hline ";
    }
    return tex;
}

let getPlavStr = function (plavData) {
    let tex = "";
    for (let i=0; i<plavData.length; i++){
        tex+=lescape(plavData[i].nam)+" & "+locale.insNumber(plavData[i].val,1);
        tex+=" \\\\ \\hline ";
    }
    return tex;
}

let getChemTbl = function (chemData) {
    let tex = "";
    if (chemData.length){
        tex+="\\begin{tabular}{|c|c|c|} \\hline ";
        tex+="Элемент & Требование НД, \\% & Фактическое значение, \\% \\\\ \\hline ";
        for (let i=0; i<chemData.length; i++){
            tex+=lescape(chemData[i].sig)+" & ";
            if (chemData[i].min!=null || chemData[i].max!=null){
                if (chemData[i].min==null || chemData[i].min==0){
                    tex+="не более ";
                    tex+=locale.insNumber(chemData[i].max,3);
                } else if (chemData[i].max==null){
                    tex+="не менее ";
                    tex+=locale.insNumber(chemData[i].min,3);
                } else {
                    tex+=locale.insNumber(chemData[i].min,3)+" - "+locale.insNumber(chemData[i].max,3);
                }
            }
            tex+=" & "+locale.insNumber(chemData[i].val,3);
            tex+=" \\\\ \\hline ";
        }
        tex+="\\end{tabular}";
    }
    return tex;
}

let getMechTbl = function (mechData) {
    let tex = "";
    let cat = "";
    if (mechData.length){
        for (let i=0; i<mechData.length; i++){
            if (mechData[i].cat_nam!=cat){
                if (i>0){
                    tex+="\\end{tabular} \\vspace{2.5mm}  \\\\ \\hline ";
                }
                cat=mechData[i].cat_nam;
                tex+=lescape(mechData[i].cat_nam)+": & \\vspace{-2.5mm} \\begin{tabular}{|p{5cm}|p{1.8cm}|p{2cm}|} \\hline ";
                tex+="\\makecell[c]{Параметр} & \\makecell[c]{Требование \\\\НД} & \\makecell[c]{Фактическое \\\\значение} \\\\ \\hline ";
            }
            tex+=mechData[i].nam+" & ";
            let prefix="";
            if (mechData[i].prefix!=null){
                prefix=lescape(mechData[i].prefix);
            }
            if (mechData[i].min!=null || mechData[i].max!=null){
                if (mechData[i].min==null || mechData[i].min==0){
                    tex+="не более ";
                    tex+=locale.insNumber(mechData[i].max,2);
                } else if (mechData[i].max==null){
                    tex+="не менее ";
                    tex+=locale.insNumber(mechData[i].min,2);
                } else {
                    tex+=locale.insNumber(mechData[i].min,2)+" - "+locale.insNumber(mechData[i].max,2);
                }
            } else {
                tex+=prefix;
            }
            tex+=" & \\makecell[c]{ "+prefix+" "+locale.insNumber(mechData[i].val,2)+" } \\\\ \\hline ";
        }
        tex+="\\end{tabular} \\vspace{2.5mm}  \\\\ \\hline ";
    }
    return tex;
}

let getAmpTbl = function (ampData) {
    let tex = "";
    if (ampData.length){
        tex+= "\\begin{table}[h!] \\centering \\caption*{Режимы сварки} \\begin{tabular}{|c|c|p{3cm}|p{3cm}|p{3cm}|} \\hline ";
        tex+="\\multirow{2}{*}{Слой шва} & \\multirow{2}{*}{Полярность} &\\multicolumn{3}{c|}{Сварочный ток (А) в положении при сварке} \\\\ \\cline{3-5} ";
        tex+="&& \\makecell[c]{нижнее} & \\makecell[c]{вертикальное} & \\makecell[c]{потолочное} \\\\ \\hline ";
        for (let i=0; i<ampData.length; i++){
            tex+="\\makecell[c]{"+lescape(ampData[i].lay)+"} & \\makecell[c]{"+lescape(ampData[i].pol)+"} "
            tex+="& \\makecell[c]{"+lescape(ampData[i].bot)+"} & \\makecell[c]{"+lescape(ampData[i].vert)+"} & \\makecell[c]{"+lescape(ampData[i].top)+"} \\\\ \\hline ";
        }
        tex+="\\end{tabular} \\end{table} "
    }
    return tex;
}

let getDoc = function(data,partData,tustr,sertData,chemData,mechData,ampData,plavData,body) {
    let tex=data.replace(/<npart>/g,lescape(partData.n_s));
    tex=tex.replace(/<okp>/g,lescape(partData.okp));
    tex=tex.replace(/<marka>/g,lescape(partData.marka));
    tex=tex.replace(/<diam>/g,locale.insNumber(partData.diam,1));
    tex=tex.replace(/<type>/g,lescape(partData.type));
    tex=tex.replace(/<massa>/g,locale.insNumber(partData.massa,1));
    tex=tex.replace(/<provol>/g,lescape(partData.provol));
    tex=tex.replace(/<dat>/g,locale.insDate(partData.dat));
    tex=tex.replace(/<long>/g,locale.insNumber(partData.long,0));
    tex=tex.replace(/<kfmp>/g,locale.insNumber(partData.kfmp,2));
    tex=tex.replace(/<proc>/g,lescape(partData.proc));
    tex=tex.replace(/<vl>/g,lescape(partData.vl));
    tex=tex.replace(/<rasx>/g,locale.insNumber(partData.rasx,1));
    tex=tex.replace(/<grp>/g,lescape(partData.grp));
    tex=tex.replace(/<descr>/g,lescape(partData.descr));

    tex=tex.replace(/<frac>/g,getFrac(partData));
    tex=tex.replace(/<plav>/g,getPlavStr(plavData));
    tex=tex.replace(/<sert>/g,getSertStr(sertData));
    tex=tex.replace(/<chem>/g,getChemTbl(chemData));
    tex=tex.replace(/<mech>/g,getMechTbl(mechData));
    tex=tex.replace(/<amp>/g,getAmpTbl(ampData));

    tex=tex.replace(/<tustr>/g,lescape(tustr));

    tex=tex.replace(/<date>/g,lescape(body.date));
    tex=tex.replace(/<auth>/g,lescape(body.auth));
    tex=tex.replace(/<check>/g,lescape(body.check));
    tex=tex.replace(/<norm>/g,lescape(body.norm));
    tex=tex.replace(/<app>/g,lescape(body.app));
    tex=tex.replace(/<authTitle>/g,lescape(body.authTitle));
    tex=tex.replace(/<checkTitle>/g,lescape(body.checkTitle));
    tex=tex.replace(/<appTitle>/g,lescape(body.appTitle));
    return tex;
}

module.exports = function (app) {
    var bodyParser = require('body-parser');
    var jsonParser = bodyParser.json();
    app.post("/pasport/elrtr/:id", jsonParser, async (req, res) => {
        let id_part=Number(req.params["id"]);
        console.log('BODY:', req.body);
        fs.readFile(__dirname+'/tex/document.tex', 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                res.status(500).type('text/plain');
                res.send(err.message);
                return;
            }
            const pdfStream = through();
            const options = {
                inputs: __dirname+'/tex',
                fonts: __dirname+'/tex/font',
                cmd: 'xelatex',
                passes: 2
            }
            getPartData(id_part)
            .then((partdata)=>{
                srtdata.getTuData(id_part)
                .then((tudata)=>{
                    getSertData(id_part)
                    .then((sertData)=>{
                        getChemData(id_part)
                        .then((chemData)=>{
                            getMechData(id_part)
                            .then((mechData)=>{
                                getAmpData(id_part)
                                .then((ampData)=>{
                                    getPlavData(id_part)
                                .then((plavData)=>{
                                        let tustr="";
                                        for (let i = 0; i < tudata.length; i++) {
                                            if (tustr!=""){
                                                tustr+=", ";
                                            }
                                            tustr+=tudata[i].nam;
                                        }
                                        const pdf = latex(getDoc(data,partdata,tustr,sertData,chemData,mechData,ampData,plavData,req.body), options);
                                        pdf.pipe(pdfStream);
                                        pdf.on('finish', () =>{ 
                                            res.type('application/pdf');
                                            pdfStream.pipe(res);
                                        })                
                                        pdf.on('error', err => {
                                            console.error(err);
                                            res.status(500).type('text/plain');
                                            res.send(err.message);
                                        })
                                    }).catch((error) => {
                                    console.log('ERROR:', error);
                                    res.status(500).type('text/plain');
                                    res.send(error.message);
                                    })
                                }).catch((error) => {
                                    console.log('ERROR:', error);
                                    res.status(500).type('text/plain');
                                    res.send(error.message);
                                })
                            }).catch((error) => {
                                console.log('ERROR:', error);
                                res.status(500).type('text/plain');
                                res.send(error.message);
                            })
                        }).catch((error) => {
                            console.log('ERROR:', error);
                            res.status(500).type('text/plain');
                            res.send(error.message);
                        })
                    }).catch((error) => {
                        console.log('ERROR:', error);
                        res.status(500).type('text/plain');
                        res.send(error.message);
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
            });
            });
        });
    });
}