const latex = require('node-latex');
const fs = require('fs');
const through = require('through2');
const db = require('../../../postgres.js');
const srtdata = require("../../certificates/elrtr/data.js");

let getPartData = async function (id) {
    let query = 
        "select p.id as id, p.n_s as n_s, p.dat_part as dat, e.marka_sert as marka, p.diam as diam, p.kfmp as kfmp, ev.proc as proc, e.shelf_life as warr, "+
        "gt.nam as type, pu.nam as pu, coalesce (p.ibco, ev.znam) as znam, coalesce(pp.nam, pe.nam) as provol, el.nam as long, e.vl as vl, eg.typ as grp, "+
        "(select sum(kvo) from part_prod where part_prod.id=p.id) as massa, "+
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

let getDoc = function(data,partdata,tustr) {
    let tex=data.replace(/<npart>/g,partdata.n_s);
    tex=tex.replace(/<marka>/g,partdata.marka);
    tex=tex.replace(/<diam>/g,partdata.diam);
    tex=tex.replace(/<znam>/g,partdata.znam);
    tex=tex.replace(/<type>/g,partdata.type);
    tex=tex.replace(/<pu>/g,partdata.pu);
    tex=tex.replace(/<massa>/g,partdata.massa);
    tex=tex.replace(/<provol>/g,partdata.provol);
    tex=tex.replace(/<dat>/g,partdata.dat);
    tex=tex.replace(/<long>/g,partdata.long);
    tex=tex.replace(/<kfmp>/g,partdata.kfmp);
    tex=tex.replace(/<proc>/g,partdata.proc);
    tex=tex.replace(/<vl>/g,partdata.vl);
    tex=tex.replace(/<rasx>/g,partdata.rasx);
    tex=tex.replace(/<plav>/g,partdata.plav);
    tex=tex.replace(/<warr>/g,partdata.warr);
    tex=tex.replace(/<grp>/g,partdata.grp);

    tex=tex.replace(/<tustr>/g,tustr);
    return tex;
}

module.exports = function (app) {
    app.get("/pasport/elrtr", async (req, res) => {    
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
            getPartData(63542)
            .then((partdata)=>{
                srtdata.getTuData(63542)
                .then((tudata)=>{
                    let tustr="";
                    for (let i = 0; i < tudata.length; i++) {
                        if (tustr!=""){
                            tustr+=", ";
                        }
                        tustr+=tudata[i].nam;
                    }
                    const pdf = latex(getDoc(data,partdata,tustr), options);
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
                })
                .catch((error) => {
                    console.log('ERROR:', error);
                    res.status(500).type('text/plain');
                    res.send(error.message);
                });
            })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            });
        });
    })
}