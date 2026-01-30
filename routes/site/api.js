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
    const data = await db.one("select zs.nom_doc, zs.dat_beg, zs.dat_end, " +
        "zs.dat_doc, zs.id_ved, COALESCE(zs.gr_tech_ust,'') as gr_tech_ust, zd.fnam as nazv " +
        "from zvd_sert zs " +
        "inner join zvd_doc zd on zd.id=zs.id_doc " +
        "where zs.id = $1 ", [Number(id_doc)]);
    return data;
}

let getDocsData = async function () {
    const data = await db.any("select zs.nom_doc, zs.dat_beg, zs.dat_end, " +
        "zs.dat_doc, zs.id_ved, COALESCE(zs.gr_tech_ust,'') as gr_tech_ust, zd.fnam as nazv " +
        "from zvd_sert zs " +
        "inner join zvd_doc zd on zd.id=zs.id_doc " +
        "where COALESCE(zs.dat_end,'3000-01-01')>= $1 ", [new Date()]);
    return data;
}

let getElData = async function () {
    const data = await db.any("select e.id as id, coalesce(e.marka_sert, e.marka) as marka, et.snam as vid, " +
        "g.nam as type, pu.nam as suf, d.nam as znam, " +
        "i.nam as iso, a.nam as aws, e.id_pic as id_pol, p.descr as pol, e.katalog as active, " +
        "COALESCE(e.descr,'') as descr, COALESCE(e.descr_spec,'') as descr_spec, COALESCE(e.descr_feature,'') as descr_feature, COALESCE(e.pr2,'') as proc " +
        "from elrtr as e " +
        "inner join el_types as et on e.id_vid=et.id " +
        "inner join gost_types as g on e.id_gost_type=g.id " +
        "inner join purpose as pu on e.id_purpose=pu.id " +
        "inner join denominator as d on e.id_denominator=d.id " +
        "inner join iso_types as i on e.id_iso_type=i.id " +
        "inner join aws_types as a on e.id_aws_type=a.id " +
        "inner join pics as p on e.id_pic=p.id ");
    return data;
}

let getElTu = async function (id_el) {
    const data = await db.any("select nam from zvd_get_tu_var( $1, $2, 4, 1)", [new Date(), Number(id_el)]);
    return data;
}

let getElAmp = async function (id_el) {
    const data = await db.any("select d.diam, a.bot, a.vert, a.ceil from amp as a " +
        "inner join diam as d on a.id_diam=d.id " +
        "where a.id_el = $1 and a.id_var=1 order by d.diam", [Number(id_el)]);
    return data;
}

let getElPlav = async function (id_el) {
    const data = await db.any("select n.nam, e.value from el_plav as e " +
        "inner join el_plav_nams as n on e.id_plav=n.id " +
        "where e.id_el = $1 order by e.id_plav", [Number(id_el)]);
    return data;
}

let getElChem = async function (id_el) {
    const data = await db.any("select t.nam, t.sig, c.min, c.max from chem_tu as c " +
        "inner join chem_tbl as t on t.id=c.id_chem " +
        "where c.id_el = $1 and c.id_var=1 order by t.sig", [Number(id_el)]);
    return data;
}

let getElMech = async function (id_el) {
    const data = await db.any("select t.nam_html, t.sig_html, m.min, m.max from mech_tu as m " +
        "inner join mech_tbl as t on t.id=m.id_mech " +
        "where m.id_el = $1 and m.id_var=1 order by t.nam_html", [Number(id_el)]);
    return data;
}

let getElDiams = async function (id_el) {
    const data = await db.any("select * from( " +
        "(select d.diam as diam from amp as a " +
        "inner join diam as d on a.id_diam=d.id " +
        "where a.id_el = $1) " +
        "union " +
        "(select d.diam as diam from cena as c " +
        "inner join diam as d on c.id_diam=d.id " +
        "where c.dat=(select max(dat) from cena) and c.id_el = $1 ) " +
        ") as de order by de.diam", [Number(id_el)]);
    return data;
}

let getElSert = async function (id_el) {
    const data = await db.any("select zs.nom_doc as nam, ze.id_sert as id_sert, '' as diams " +
        "from zvd_els ze " +
        "inner join zvd_sert zs on zs.id = ze.id_sert " +
        "where COALESCE(zs.dat_end,'3000-01-01')>= $1 and ze.id_el = $2 " +
        "union " +
        "select zs.nom_doc, ze.id_sert, STRING_AGG(to_char(de.dim,'FM0D0'),'#' ORDER BY de.dim) " +
        "from zvd_eldim ze " +
        "inner join zvd_sert zs on zs.id = ze.id_sert " +
        "inner join dry_els de on de.ide = ze.id_eldr " +
        "where COALESCE(zs.dat_end,'3000-01-01')>= $1 and de.id_el = $2 " +
        "group by ze.id_sert, zs.nom_doc", [new Date(), Number(id_el)]);
    return data;
}

let getWireData = async function () {
    const data = await db.any("select p.id as id, p.nam as marka, coalesce(p.description,'') as descr , " +
        "t.nam as type, COALESCE(pp.nam, p.nam) as base, p.katalog as active " +
        "from provol as p " +
        "inner join provol_type as t on t.id = p.id_type " +
        "left join provol as pp on pp.id=p.id_base");
    return data;
}

let getWireTu = async function (id_wire) {
    const data = await db.any("select g.nam as nam from wire_gost as w " +
        "inner join gost_new as g on w.id_gost=g.id " +
        "where w.id_provol= $1 order by g.nam", [Number(id_wire)]);
    return data;
}

let getWireChem = async function (id_wire) {
    const data = await db.any("select t.nam, t.sig, c.min, c.max from wire_chem_tu as c " +
        "inner join chem_tbl as t on t.id=c.id_chem " +
        "where c.id_provol = (select coalesce(p.id_base,p.id) from provol as p where p.id = $1 ) order by t.sig", [Number(id_wire)]);
    return data;
}

let getWireDiams = async function (id_wire) {
    const data = await db.any("select dg.diam, k.spool " +
        "from( " +
        "select dm.diam as diam, wd.id_diam from wire_diams as wd " +
        "inner join diam as dm on wd.id_diam=dm.id " +
        "where wd.id_wire = $1 " +
        "union " +
        "select distinct d.diam as diam, c.id_diam from wire_cena as c " +
        "inner join diam as d on c.id_diam=d.id " +
        "where c.dat=(select max(dat) from wire_cena) and c.id_provol = $1 " +
        ") as dg " +
        "inner join ( " +
        "select c.id_diam as id_diam, STRING_AGG(distinct k.short,'#' order by k.short) as spool " +
        "from wire_cena as c " +
        "inner join wire_pack_kind as k on c.id_pack=k.id " +
        "where c.dat=(select max(dat) from wire_cena) " +
        "group by c.id_diam " +
        ") as k on k.id_diam = dg.id_diam " +
        "order by dg.diam", [Number(id_wire)]);
    return data;
}

let getWireSert = async function (id_wire) {
    const data = await db.any("select zs.nom_doc as nam, z.id_sert as id_sert, '' as diams  from zvd_wire_sert as z " +
        "inner join zvd_sert zs on zs.id = z.id_sert " +
        "where COALESCE(zs.dat_end,'3000-01-01')>= $1 and z.id_provol = $2 " +
        "union " +
        "select zs.nom_doc, zwds.id_sert, STRING_AGG(to_char(d.diam,'FM0D0'),'#' ORDER BY d.diam) " +
        "from zvd_wire_diam_sert zwds " +
        "inner join zvd_sert zs on zs.id = zwds.id_sert " +
        "inner join diam d on d.id=zwds.id_diam " +
        "where COALESCE(zs.dat_end,'3000-01-01')>= $1 and zwds.id_provol = $2 " +
        "group by zs.nom_doc, zwds.id_sert", [new Date(), Number(id_wire)]);
    return data;
}

let sendReq = async function (sitedata, path, method, body) {
    let err = "";
    let ok = false;
    let data;

    const headers = new fetch.Headers({
        "Accept": "application/json",
        "Accept-Charset": "UTF-8",
        "User-Agent": "Appszsm",
        "Cookie": "beget=begetok",
        "Content-Type": "application/pdf",
    });

    let url = sitedata.url + '/rest/3/' + sitedata.code + '/' + path;

    let response = await fetch(url, {
        method: method,
        headers,
        body: body,
    });

    if (response.headers.get('Content-Type').indexOf('application/json') >= 0) {
        let jsonObj = await response.json();
        if (response.ok) {
            data = jsonObj['result'];
            ok = true;
        } else {
            err = jsonObj['error_description'];
        }
    } else {
        err = await response.text();
    }
    return { object: data, error: err, ok: ok };
}

let addDoc = async function (sitedata, data, body) {
    const param = {
        'NAME': data.nom_doc,
        'fields[TIP_DOKUMENTA]': data.nazv,
        'fields[NACHALO_DEYSTVIYA]': dateString(data.dat_beg),
        'fields[KONETS_DEYSTVIYA]': dateString(data.dat_end),
        'fields[DATA_VYDACHI]': dateString(data.dat_doc),
        'fields[VEDOMSTVO]': data.id_ved,
        'fields[GRUPPY_TEKHNICHESKIKH_USTROYSTV]': data.gr_tech_ust,
    };
    return await sendReq(sitedata, "docs.Element.add?" + queryString(param), "POST", body);
}

let updDoc = async function (sitedata, id, data, clearFile, body) {
    const param = {
        'elementId': id,
        'NAME': data.nom_doc,
        'clearfile': clearFile,
        'fields[TIP_DOKUMENTA]': data.nazv,
        'fields[NACHALO_DEYSTVIYA]': dateString(data.dat_beg),
        'fields[KONETS_DEYSTVIYA]': dateString(data.dat_end),
        'fields[DATA_VYDACHI]': dateString(data.dat_doc),
        'fields[VEDOMSTVO]': data.id_ved,
        'fields[GRUPPY_TEKHNICHESKIKH_USTROYSTV]': data.gr_tech_ust,
    };
    return await sendReq(sitedata, "docs.Element.upd?" + queryString(param), "POST", body);
}

function queryString(params) {
    return Object.keys(params).map((key) => `${key}=${encodeURIComponent(params[key])}`).join('&');
}

function dateString(dat) {
    str = '';
    if (dat != null) {
        str = locale.insDate(dat);
    }
    return str;
}

function simbEq(kis, data) {
    return (kis == encode.decode(data)) || (kis == '-' && data == '');
}

function lenEq(kis, data) {
    let eq = false;
    if (data) {
        eq = (kis.length == data.length);
    } else {
        eq = (kis.length == 0);
    }
    return eq;
}

function paramEq(kis, data) {
    let eq = false;
    if (data) {
        eq = (kis == data);
    } else {
        eq = (kis.length == 0);
    }
    return eq;
}

function getElProc(p) {
    let proc = '';
    const sp = String(p).split(':');
    if (sp.length == 4) {
        proc = sp[0] + "±" + sp[1] + "°C " + sp[2] + " " + sp[3];
    }
    return proc;
}

function getPar(p) {
    return (p == '-' || p == null) ? '' : p;
}

function elEqual(kis, data, tu, amp, plav, chem, mech, diams, sert, mapDoc) {
    let eq = (kis.marka == encode.decode(data['NAME']) &&
        ((kis.active && (data['ACTIVE'] == 'Y')) || (!kis.active && (data['ACTIVE'] == 'N'))) &&
        kis.vid == encode.decode(data['NAZNACHENIE']) &&
        simbEq(kis.type, data['TIP_PO_GOST']) &&
        simbEq(kis.suf, data['SUFFIKS']) &&
        simbEq(kis.znam, data['ZNAMENATEL']) &&
        simbEq(kis.iso, data['TIP_PO_ISO']) &&
        simbEq(kis.aws, data['TIP_PO_AWS']) &&
        kis.id_pol == data['POLOZHENIE_PRI_SVARKE'] &&
        kis.descr == encode.decode(data['OPISANIE']) &&
        kis.descr_spec == encode.decode(data['OSOBYE_SVOYSTVA']) &&
        kis.descr_feature == encode.decode(data['TEKHNOLOGICHESKIE_OSOBENNOSTI_SVARKI']) &&
        getElProc(kis.proc) == encode.decode(data['PROKALKA_PERED_SVARKOY']) &&
        kis.marka == encode.decode(data['NAZVANIE']) &&
        data['KHIMICHESKIY_SOSTAV_PROVOLOKI'] == false &&
        data['TIP_PROVOLOKI'] == '' &&
        data['BAZOVAYA_MARKA'] == ''
    );

    let tuEq = eq && lenEq(tu, data['NORMATIVNAYA_DOKUMENTATSIYA']);
    if (tuEq) {
        for (let i = 0; i < tu.length; i++) {
            tuEq = tuEq && (tu[i].nam == encode.decode(data['NORMATIVNAYA_DOKUMENTATSIYA'][i]));
            //console.log(data['NORMATIVNAYA_DOKUMENTATSIYA'][i],tu[i].nam);
        }
    }

    let ampEq = eq && lenEq(amp, data['REKOMENDUEMOE_ZNACHENIE_TOKA']);
    if (ampEq) {
        for (let i = 0; i < amp.length; i++) {
            const str = locale.insNumber(amp[i].diam, 1) + "#" + amp[i].bot + "#" + amp[i].vert + "#" + amp[i].ceil + "#";
            ampEq = ampEq && (str == encode.decode(data['REKOMENDUEMOE_ZNACHENIE_TOKA'][i]));
            //console.log(data['REKOMENDUEMOE_ZNACHENIE_TOKA'][i],str);
        }
    }

    let plavEq = eq && lenEq(plav, data['KHARAKTERISTIKI_PLAVLENIYA']);
    if (plavEq) {
        for (let i = 0; i < plav.length; i++) {
            const str = plav[i].nam + "#" + locale.insNumber(plav[i].value, 2) + "#";
            plavEq = plavEq && (str == encode.decodeEntity(data['KHARAKTERISTIKI_PLAVLENIYA'][i]));
            //console.log(data['KHARAKTERISTIKI_PLAVLENIYA'][i],str);
        }
    }

    let chemEq = eq && lenEq(chem, data['KHIMICHESKIY_SOSTAV_NAPLAVLENNOGO_METALLA']);
    if (chemEq) {
        for (let i = 0; i < chem.length; i++) {
            let min = (chem[i].min == null) ? '' : locale.insNumber(chem[i].min, 3);
            let max = (chem[i].max == null) ? '' : locale.insNumber(chem[i].max, 3);
            const str = chem[i].nam + "#" + chem[i].sig + "#" + min + " - " + max + "#";
            chemEq = chemEq && (str == encode.decode(data['KHIMICHESKIY_SOSTAV_NAPLAVLENNOGO_METALLA'][i]));
            //console.log(data['KHIMICHESKIY_SOSTAV_NAPLAVLENNOGO_METALLA'][i],str);
        }
    }

    let mechEq = eq && lenEq(mech, data['MEKHANICHESKIE_SVOYSTVA_METALLA_SHVA_I_NAPLAVLENNO']);
    if (mechEq) {
        for (let i = 0; i < mech.length; i++) {
            let val = '';
            if (mech[i].min == null && mech[i].max != null) {
                val = "<= " + locale.insNumber(mech[i].max, 3);
            } else if (mech[i].max == null && mech[i].min != null) {
                val = ">= " + locale.insNumber(mech[i].min, 3);
            } else if (mech[i].max != null && mech[i].min != null) {
                val = locale.insNumber(mech[i].min, 3) + " - " + locale.insNumber(mech[i].max, 3);
            }
            const str = encode.decode(mech[i].nam_html + "#" + mech[i].sig_html + "#" + val + "#");
            mechEq = mechEq && (str == encode.decode(data['MEKHANICHESKIE_SVOYSTVA_METALLA_SHVA_I_NAPLAVLENNO'][i]));
            //console.log(encode.decode(data['MEKHANICHESKIE_SVOYSTVA_METALLA_SHVA_I_NAPLAVLENNO'][i]),str);
        }
    }

    let diamsEq = eq && lenEq(diams, data['DIAMETER']);
    if (diamsEq) {
        for (let i = 0; i < diams.length; i++) {
            diamsEq = diamsEq && (locale.insNumber(diams[i].diam, 1) == encode.decode(data['DIAMETER'][i]));
            //console.log(data['DIAMETER'][i],locale.insNumber(diams[i].diam,1));
        }
    }

    let sertEq = eq && lenEq(sert, data['DOC']['VALUE']);
    if (sertEq && data['DOC']['VALUE']) {
        let map = new Map();
        for (let i = 0; i < data['DOC']['VALUE'].length; i++) {
            map.set(data['DOC']['VALUE'][i], data['DOC']['DESCRIPTION'][i]);
        }
        for (let i = 0; i < sert.length; i++) {
            const id_sert = mapDoc.get(sert[i].nam)['ID'];
            let descr = sert[i].diams;
            sertEq = sertEq && map.has(id_sert) && paramEq(descr, map.get(id_sert));
            //console.log(map.has(id_sert),map.get(id_sert),descr,id_sert);
        }
    }

    return eq && tuEq && ampEq && plavEq && chemEq && mechEq && diamsEq && sertEq;
}

function createElParam(id, kis, tu, amp, plav, chem, mech, diams, sert, mapDoc) {
    let param = {
        'elementId': id,
        'CATALOG': 'Каталог электродов',
        'NAME': kis.marka,
        'ACTIVE': (kis.active? 'Y' : 'N'),
        'fields[XML_ID]': kis.id,
        'fields[NAZNACHENIE]': kis.vid,
        'fields[TIP_PO_GOST]': getPar(kis.type),
        'fields[SUFFIKS]': getPar(kis.suf),
        'fields[ZNAMENATEL]': getPar(kis.znam),
        'fields[TIP_PO_ISO]': getPar(kis.iso),
        'fields[TIP_PO_AWS]': getPar(kis.aws),
        'fields[POLOZHENIE_PRI_SVARKE]': kis.id_pol,
        'fields[OPISANIE]': kis.descr,
        'fields[OSOBYE_SVOYSTVA]': kis.descr_spec,
        'fields[TEKHNOLOGICHESKIE_OSOBENNOSTI_SVARKI]': kis.descr_feature,
        'fields[PROKALKA_PERED_SVARKOY]': getElProc(kis.proc),
        'fields[NAZVANIE]': kis.marka,
        'fields[KHIMICHESKIY_SOSTAV_PROVOLOKI]' : '', 
        'fields[TIP_PROVOLOKI]': '',
        'fields[BAZOVAYA_MARKA]': '',
    };

    for (let i = 0; i < tu.length; i++) {
        param['fields[NORMATIVNAYA_DOKUMENTATSIYA][' + i + ']'] = tu[i].nam;
    }

    for (let i = 0; i < amp.length; i++) {
        const str = locale.insNumber(amp[i].diam, 1) + "#" + amp[i].bot + "#" + amp[i].vert + "#" + amp[i].ceil + "#";
        param['fields[REKOMENDUEMOE_ZNACHENIE_TOKA][' + i + ']'] = str;
    }

    for (let i = 0; i < plav.length; i++) {
        const str = plav[i].nam + "#" + locale.insNumber(plav[i].value, 2) + "#";
        param['fields[KHARAKTERISTIKI_PLAVLENIYA][' + i + ']'] = str;
    }

    for (let i = 0; i < chem.length; i++) {
        let min = (chem[i].min == null) ? '' : locale.insNumber(chem[i].min, 3);
        let max = (chem[i].max == null) ? '' : locale.insNumber(chem[i].max, 3);
        const str = chem[i].nam + "#" + chem[i].sig + "#" + min + " - " + max + "#";
        param['fields[KHIMICHESKIY_SOSTAV_NAPLAVLENNOGO_METALLA][' + i + ']'] = str;
    }

    for (let i = 0; i < mech.length; i++) {
        let val = '';
        if (mech[i].min == null && mech[i].max != null) {
            val = "<= " + locale.insNumber(mech[i].max, 3);
        } else if (mech[i].max == null && mech[i].min != null) {
            val = ">= " + locale.insNumber(mech[i].min, 3);
        } else if (mech[i].max != null && mech[i].min != null) {
            val = locale.insNumber(mech[i].min, 3) + " - " + locale.insNumber(mech[i].max, 3);
        }
        const str = encode.decode(mech[i].nam_html + "#" + mech[i].sig_html + "#" + val + "#");
        param['fields[MEKHANICHESKIE_SVOYSTVA_METALLA_SHVA_I_NAPLAVLENNO][' + i + ']'] = str;
    }

    for (let i = 0; i < diams.length; i++) {
        param['fields[DIAMETER][' + i + ']'] = locale.insNumber(diams[i].diam, 1);
    }

    for (let i = 0; i < sert.length; i++) {
        const id_sert = mapDoc.get(sert[i].nam)['ID'];
        let descr = sert[i].diams;
        param['fields[DOC][' + i + '][VALUE]'] = id_sert;
        param['fields[DOC][' + i + '][DESCRIPTION]'] = descr;
    }

    return param;
}

let syncEl = async function (sitedata, data, mapDoc) {
    let err = [];
    let count=0;
    const kis = await getElData();
    for (let i = 0; i < kis.length; i++) {
        const tu = await getElTu(kis[i].id);
        const amp = await getElAmp(kis[i].id);
        const plav = await getElPlav(kis[i].id);
        const chem = await getElChem(kis[i].id);
        const mech = await getElMech(kis[i].id);
        const diams = await getElDiams(kis[i].id);
        const sert = await getElSert(kis[i].id);
        if (data.has(kis[i].id)) {
            if (!elEqual(kis[i], data.get(kis[i].id), tu, amp, plav, chem, mech, diams, sert, mapDoc)) {
                //обновить
                //console.log("for update:" + kis[i].marka + " id=" + kis[i].id);
                let upd = await sendReq(sitedata, "catalog.Element.upd?" + queryString(createElParam(data.get(kis[i].id)['ID'], kis[i], tu, amp, plav, chem, mech, diams, sert, mapDoc)), "POST", '');
                if (!upd.ok) {
                    err.push("Обновление "+kis[i].marka+": "+upd.error);
                } else {
                    count++;
                }
            }
        } else if (kis[i].active){
            //добавить
            //console.log("not exist:" + kis[i].marka + " id=" + kis[i].id);
            let add = await sendReq(sitedata, "catalog.Element.add?" + queryString(createElParam('', kis[i], tu, amp, plav, chem, mech, diams, sert, mapDoc)), "POST", '');
            if (!add.ok) {
                err.push("Добавление "+kis[i].marka+": "+add.error);
            } else {
                count++;
            }
        }
    }
    return {error: err, count: count};
}

function wireEqual(kis, data, tu, chem, diams, sert, mapDoc) {
    let eq = (kis.marka == encode.decode(data['NAME']) &&
        ((kis.active && (data['ACTIVE'] == 'Y')) || (!kis.active && (data['ACTIVE'] == 'N'))) &&
        data['NAZNACHENIE']=='' &&
        kis.type == encode.decode(data['TIP_PROVOLOKI']) &&
        data['TIP_PO_GOST']=='' &&
        data['SUFFIKS']=='' &&
        data['ZNAMENATEL']=='' &&
        data['TIP_PO_ISO']=='' &&
        data['TIP_PO_AWS']=='' &&
        data['POLOZHENIE_PRI_SVARKE']=='' &&
        kis.descr == encode.decode(data['OPISANIE']) &&
        data['OSOBYE_SVOYSTVA']=='' &&
        data['TEKHNOLOGICHESKIE_OSOBENNOSTI_SVARKI']=='' &&
        data['PROKALKA_PERED_SVARKOY']=='' &&
        kis.marka == encode.decode(data['NAZVANIE']) &&
        data['KHIMICHESKIY_SOSTAV_NAPLAVLENNOGO_METALLA']==false &&
        kis.type==encode.decode(data['TIP_PROVOLOKI']) &&
        kis.base==encode.decode(data['BAZOVAYA_MARKA']) &&
        data['REKOMENDUEMOE_ZNACHENIE_TOKA']==false &&
        data['KHARAKTERISTIKI_PLAVLENIYA']==false &&
        data['MEKHANICHESKIE_SVOYSTVA_METALLA_SHVA_I_NAPLAVLENNO']==false
    );

    let tuEq = eq && lenEq(tu, data['NORMATIVNAYA_DOKUMENTATSIYA']);
    if (tuEq) {
        for (let i = 0; i < tu.length; i++) {
            tuEq = tuEq && (tu[i].nam == encode.decode(data['NORMATIVNAYA_DOKUMENTATSIYA'][i]));
            //console.log(data['NORMATIVNAYA_DOKUMENTATSIYA'][i],tu[i].nam);
        }
    }

    let chemEq = eq && lenEq(chem, data['KHIMICHESKIY_SOSTAV_PROVOLOKI']);
    if (chemEq) {
        for (let i = 0; i < chem.length; i++) {
            let min = (chem[i].min == null) ? '' : locale.insNumber(chem[i].min, 3);
            let max = (chem[i].max == null) ? '' : locale.insNumber(chem[i].max, 3);
            const str = chem[i].nam + "#" + chem[i].sig + "#" + min + " - " + max + "#";
            chemEq = chemEq && (str == encode.decode(data['KHIMICHESKIY_SOSTAV_PROVOLOKI'][i]));
            //console.log(data['KHIMICHESKIY_SOSTAV_PROVOLOKI'][i],str);
        }
    }

    let diamsEq = eq && lenEq(diams, data['DIAMETER']);
    if (diamsEq) {
        for (let i = 0; i < diams.length; i++) {
            diamsEq = diamsEq && (locale.insNumber(diams[i].diam, 1) == encode.decode(data['DIAMETER'][i]));
            //console.log(data['DIAMETER'][i],locale.insNumber(diams[i].diam,1));
        }
    }

    let spoolEq = eq && lenEq(diams, data['NOSITELI_PROVOLOKI']['VALUE']);
    if (spoolEq) {
        for (let i = 0; i < diams.length; i++) {
            spoolEq = spoolEq && (locale.insNumber(diams[i].diam, 1) == encode.decode(data['NOSITELI_PROVOLOKI']['VALUE'][i]))
                && (diams[i].spool == encode.decode(data['NOSITELI_PROVOLOKI']['DESCRIPTION'][i]));
            //console.log(data['NOSITELI_PROVOLOKI']['DESCRIPTION'][i],diams[i].spool);
        }
    }

    let sertEq = eq && lenEq(sert, data['DOC']['VALUE']);
    if (sertEq && data['DOC']['VALUE']) {
        let map = new Map();
        for (let i = 0; i < data['DOC']['VALUE'].length; i++) {
            map.set(data['DOC']['VALUE'][i], data['DOC']['DESCRIPTION'][i]);
        }
        for (let i = 0; i < sert.length; i++) {
            const id_sert = mapDoc.get(sert[i].nam)['ID'];
            let descr = sert[i].diams;
            sertEq = sertEq && map.has(id_sert) && paramEq(descr, map.get(id_sert));
            //console.log(map.has(id_sert),map.get(id_sert),descr,id_sert);
        }
    }

    return eq && tuEq && chemEq && diamsEq && spoolEq && sertEq;
}

function createWireParam(id, kis, tu, chem, diams, sert, mapDoc) {
    let param = {
        'elementId': id,
        'CATALOG': 'Каталог проволоки',
        'NAME': kis.marka,
        'ACTIVE': (kis.active? 'Y' : 'N'),
        'fields[XML_ID]': kis.id,
        'fields[NAZNACHENIE]': '',
        'fields[TIP_PO_GOST]': '',
        'fields[SUFFIKS]': '',
        'fields[ZNAMENATEL]': '',
        'fields[TIP_PO_ISO]': '',
        'fields[TIP_PO_AWS]': '',
        'fields[POLOZHENIE_PRI_SVARKE]': '',
        'fields[OPISANIE]': kis.descr,
        'fields[OSOBYE_SVOYSTVA]': '',
        'fields[TEKHNOLOGICHESKIE_OSOBENNOSTI_SVARKI]': '',
        'fields[PROKALKA_PERED_SVARKOY]': '',
        'fields[NAZVANIE]': kis.marka,
        'fields[TIP_PROVOLOKI]': kis.type,
        'fields[BAZOVAYA_MARKA]': kis.base,
        'fields[REKOMENDUEMOE_ZNACHENIE_TOKA]' : '',
        'fields[KHARAKTERISTIKI_PLAVLENIYA]' : '',
        'fields[KHIMICHESKIY_SOSTAV_NAPLAVLENNOGO_METALLA]' : '',
        'fields[MEKHANICHESKIE_SVOYSTVA_METALLA_SHVA_I_NAPLAVLENNO]' : '',
    };

    for (let i = 0; i < tu.length; i++) {
        param['fields[NORMATIVNAYA_DOKUMENTATSIYA][' + i + ']'] = tu[i].nam;
    }


    for (let i = 0; i < chem.length; i++) {
        let min = (chem[i].min == null) ? '' : locale.insNumber(chem[i].min, 3);
        let max = (chem[i].max == null) ? '' : locale.insNumber(chem[i].max, 3);
        const str = chem[i].nam + "#" + chem[i].sig + "#" + min + " - " + max + "#";
        param['fields[KHIMICHESKIY_SOSTAV_PROVOLOKI][' + i + ']'] = str;
    }

    for (let i = 0; i < diams.length; i++) {
        param['fields[DIAMETER][' + i + ']'] = locale.insNumber(diams[i].diam, 1);

        param['fields[NOSITELI_PROVOLOKI][' + i + '][VALUE]'] = locale.insNumber(diams[i].diam, 1);
        param['fields[NOSITELI_PROVOLOKI][' + i + '][DESCRIPTION]'] = diams[i].spool;
    }

    for (let i = 0; i < sert.length; i++) {
        const id_sert = mapDoc.get(sert[i].nam)['ID'];
        let descr = sert[i].diams;
        param['fields[DOC][' + i + '][VALUE]'] = id_sert;
        param['fields[DOC][' + i + '][DESCRIPTION]'] = descr;
    }

    return param;
}

let syncWire = async function (sitedata, data, mapDoc) {
    let err = [];
    let count=0;
    const kis = await getWireData();
    for (let i = 0; i < kis.length; i++) {
        const tu = await getWireTu(kis[i].id);
        const chem = await getWireChem(kis[i].id);
        const diams = await getWireDiams(kis[i].id);
        const sert = await getWireSert(kis[i].id);
        if (data.has(kis[i].id)) {
            if (!wireEqual(kis[i], data.get(kis[i].id), tu, chem, diams, sert, mapDoc)) {
                //обновить
                //console.log("for update:" + kis[i].marka + " id=" + kis[i].id);
                let upd = await sendReq(sitedata, "catalog.Element.upd?" + queryString(createWireParam(data.get(kis[i].id)['ID'], kis[i], tu, chem, diams, sert, mapDoc)), "POST", '');
                if (!upd.ok) {
                    err.push("Обновление "+kis[i].marka+": "+upd.error);
                } else {
                    count++;
                }
            }
        } else if (kis[i].active){
            //добавить
            //console.log("not exist:" + kis[i].marka + " id=" + kis[i].id);
            let add = await sendReq(sitedata, "catalog.Element.add?" + queryString(createWireParam('', kis[i], tu, chem, diams, sert, mapDoc)), "POST", '');
            if (!add.ok) {
                err.push("Добавление "+kis[i].marka+": "+add.error);
            } else {
                count++;
            }
        }
    }
    return {error: err, count: count};
}

module.exports = function (app) {

    app.get("/site/sync", async (req, res) => {
        try {
            let docCount = 0;
            let catCount = 0;
            let err = [];
            const sitedata = await getSiteData();

            //сиинхронизация документов
            const doc = await sendReq(sitedata, "docs.Element.listall", "GET");
            if (doc.ok) {
                let mapDoc = new Map();
                doc.object.forEach(function (table) {
                    mapDoc.set(table['NAME'], table);
                });

                const dataDoc = await getDocsData();

                for (let i = 0; i < dataDoc.length; i++) {
                    if (mapDoc.has(dataDoc[i].nom_doc)) {
                        siteDoc = mapDoc.get(dataDoc[i].nom_doc);
                        if (!(dataDoc[i].nazv == encode.decode(siteDoc['TIP_DOKUMENTA']) &&
                            dataDoc[i].gr_tech_ust == encode.decode(siteDoc['GRUPPY_TEKHNICHESKIKH_USTROYSTV']) &&
                            dataDoc[i].id_ved == siteDoc['VEDOMSTVO'] &&
                            dateString(dataDoc[i].dat_beg) == siteDoc['NACHALO_DEYSTVIYA'] &&
                            dateString(dataDoc[i].dat_end) == siteDoc['KONETS_DEYSTVIYA'] &&
                            dateString(dataDoc[i].dat_doc) == siteDoc['DATA_VYDACHI'])
                        ) {
                            const upd = await updDoc(sitedata, siteDoc['ID'], dataDoc[i], false, "");
                            if (upd.ok) {
                                mapDoc.set(dataDoc[i].nom_doc, upd.object);
                                docCount++;
                            } else {
                                err.push("Обновление "+dataDoc[i].nom_doc+": "+upd.error);
                            }
                        }
                    } else {
                        const add = await addDoc(sitedata, dataDoc[i], "");
                        if (add.ok) {
                            mapDoc.set(dataDoc[i].nom_doc, add.object);
                            docCount++;
                        } else {
                            err.push("Добавление "+dataDoc[i].nom_doc+": "+add.error);
                        }
                    }
                }

                //синхронизация каталога продукции
                const cat = await sendReq(sitedata, "catalog.Element.listall", "GET");
                if (cat.ok) {
                    let mapEl = new Map();
                    let mapWire = new Map();
                    cat.object.forEach(function (el) {
                        if (el['CATALOG'] == "Каталог электродов") {
                            mapEl.set(Number(el['XML_ID']), el);
                        } else if (el['CATALOG'] == "Каталог проволоки") {
                            mapWire.set(Number(el['XML_ID']), el);
                        }
                    });

                    const resEl = await syncEl(sitedata, mapEl, mapDoc);
                    catCount+=resEl.count;
                    err=err.concat(resEl.error);

                    const resWire = await syncWire(sitedata, mapWire, mapDoc);
                    catCount+=resWire.count;
                    err=err.concat(resWire.error);

                    //console.log(mapEl);
                    //console.log(mapWire);
                    //console.log(err);

                    res.type("text/plain");
                    res.send("Обновлено  документов: "+docCount+"; Элементов каталога: "+catCount+"; Ошибок: "+err.length);

                } else {
                    res.status(500).type("text/plain");
                    res.send(cat.error);
                }
                
            } else {
                res.status(500).type("text/plain");
                res.send(doc.error);
            }
        } catch (error) {
            res.status(500).type("text/plain");
            res.send(error.message);
        }
    })

    app.get("/site/docs/list", async (req, res) => {
        try {
            const sitedata = await getSiteData();
            const dat = await sendReq(sitedata, "docs.Element.listall", "GET");
            if (dat.ok) {
                res.json(dat.object);
            } else {
                res.status(500).type("text/plain");
                res.send(dat.error);
            }
        } catch (error) {
            res.status(500).type("text/plain");
            res.send(error.message);
        }
    })

    app.post("/site/docs/upd", bodyParser.raw({ type: 'application/pdf', limit: '10mb' }), async (req, res) => {
        try {
            const sitedata = await getSiteData();
            const doc = await getDocData(req.query.id);
            const upd = await updDoc(sitedata, req.query.elementId, doc, true, req.body);
            if (upd.ok) {
                res.json(upd.object);
            } else {
                res.status(500).type("text/plain");
                res.send(upd.error);
            }
        } catch (error) {
            res.status(500).type("text/plain");
            res.send(error.message);
        }
    })

    app.post("/site/docs/add", bodyParser.raw({ type: 'application/pdf', limit: '10mb' }), async (req, res) => {
        try {
            const sitedata = await getSiteData();
            const doc = await getDocData(req.query.id);
            const add = await addDoc(sitedata, doc, req.body);
            if (add.ok) {
                res.json(add.object);
            } else {
                res.status(500).type("text/plain");
                res.send(add.error);
            }
        } catch (error) {
            res.status(500).type("text/plain");
            res.send(error.message);
        }
    })
}