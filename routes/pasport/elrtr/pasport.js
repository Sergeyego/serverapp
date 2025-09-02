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
        "(select sum(kvo) from part_prod where part_prod.id=p.id) as massa, coalesce(ev.descrtu, ev.descr) as descr, "+
        "(select value from el_plav ep where ep.id_el = p.id_el and ep.id_plav=2) as rasx, "+
        "(select value from el_plav ep where ep.id_el = p.id_el and ep.id_plav=1) as plav "+
        "from parti as p "+
        "inner join elrtr as e on e.id=p.id_el "+
        "inner join provol as pe on pe.id=e.id_gost "+
        "left join provol as pp on pp.id=p.id_prfact and pp.id in (select ep.id_prov from el_provol as ep where ep.id_el = p.id_el) "+
        "inner join gost_types as gt on e.id_gost_type=gt.id "+
        "inner join purpose as pu on e.id_purpose=pu.id "+
        "inner join el_long el on el.id=p.id_long "+
        "inner join el_grp eg on eg.id=e.id_grp "+
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

let getDoc = function(data,partdata,tustr,sertData,chemData) {
    let tex=data.replace(/<npart>/g,lescape(partdata.n_s));
    tex=tex.replace(/<marka>/g,lescape(partdata.marka));
    tex=tex.replace(/<diam>/g,locale.insNumber(partdata.diam,1));
    tex=tex.replace(/<znam>/g,lescape(partdata.znam));
    tex=tex.replace(/<type>/g,lescape(partdata.type));
    tex=tex.replace(/<pu>/g,lescape(partdata.pu));
    tex=tex.replace(/<massa>/g,locale.insNumber(partdata.massa,1));
    tex=tex.replace(/<provol>/g,lescape(partdata.provol));
    tex=tex.replace(/<dat>/g,locale.insDate(partdata.dat));
    tex=tex.replace(/<long>/g,locale.insNumber(partdata.long,0));
    tex=tex.replace(/<kfmp>/g,locale.insNumber(partdata.kfmp,2));
    tex=tex.replace(/<proc>/g,lescape(partdata.proc));
    tex=tex.replace(/<vl>/g,lescape(partdata.vl));
    tex=tex.replace(/<rasx>/g,locale.insNumber(partdata.rasx,1));
    tex=tex.replace(/<plav>/g,locale.insNumber(partdata.plav));
    tex=tex.replace(/<warr>/g,locale.insNumber(partdata.warr,0));
    tex=tex.replace(/<grp>/g,lescape(partdata.grp));
    tex=tex.replace(/<descr>/g,lescape(partdata.descr));


    tex=tex.replace(/<sert>/g,getSertStr(sertData));
    tex=tex.replace(/<chem>/g,getChemTbl(chemData));

    tex=tex.replace(/<tustr>/g,lescape(tustr));
    return tex;
}

module.exports = function (app) {
    app.get("/pasport/elrtr/:id", async (req, res) => {
        let id_part=Number(req.params["id"]);   
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
                            let tustr="";
                            for (let i = 0; i < tudata.length; i++) {
                                if (tustr!=""){
                                    tustr+=", ";
                                }
                                tustr+=tudata[i].nam;
                            }
                            const pdf = latex(getDoc(data,partdata,tustr,sertData,chemData), options);
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