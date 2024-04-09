const db = require('../../../postgres.js');

let getHeaderData = async function (id, is_ship=true) {
    let query = is_ship ? 
        "select p.id as id, p.n_s as n_s, p.yea as year, p.dat_part as dat, e.marka_sert as marka, p.diam as diam, "+
        "gt.nam as gt, pu.nam as pu, coalesce (p.ibco, ev.znam) as znam, coalesce(pp.nam, pe.nam) as provol, pol.naim as pol, "+
        "s.nom_s as nomer, coalesce(s.dat_vid, $2 ) as datvid, o.massa as massa, pol.naim_en as pol_en "+
        "from otpusk as o "+
        "inner join sertifikat as s on o.id_sert=s.id "+
        "inner join parti as p on o.id_part=p.id "+
        "inner join elrtr as e on e.id=p.id_el "+
        "inner join provol as pe on pe.id=e.id_gost "+
        "left join provol as pp on pp.id=p.id_prfact and pp.id in (select ep.id_prov from el_provol as ep where ep.id_el = p.id_el) "+
        "inner join poluch as pol on s.id_pol=pol.id "+
        "inner join gost_types as gt on e.id_gost_type=gt.id "+
        "inner join purpose as pu on e.id_purpose=pu.id "+
        "left join el_var as ev on ev.id_el = p.id_el and ev.id_var = p.id_var "+
        "where o.id = $1" 
        :
        "select p.id as id, p.n_s as n_s, p.yea as year, p.dat_part as dat, e.marka_sert as marka, p.diam as diam, "+
        "gt.nam as gt, pu.nam as pu, coalesce (p.ibco, ev.znam) as znam, coalesce(pp.nam, pe.nam) as provol, NULL as pol, "+
        "NULL as nomer, ($2)::date as datvid, j.sum as massa, NULL as pol_en "+
        "from parti as p "+
        "inner join elrtr as e on e.id=p.id_el "+
        "inner join provol as pe on pe.id=e.id_gost "+
        "left join provol as pp on pp.id=p.id_prfact and pp.id in (select ep.id_prov from el_provol as ep where ep.id_el = p.id_el) "+
        "inner join gost_types as gt on e.id_gost_type=gt.id "+
        "inner join purpose as pu on e.id_purpose=pu.id "+
        "left join (select id_part as id, sum(kvo) as sum from part_prod group by id_part) as j on j.id=p.id "+
        "left join el_var as ev on ev.id_el = p.id_el and ev.id_var = p.id_var "+
        "where p.id = $1";
    const data = await db.one(query, [ Number(id), new Date()] );
    return data;
}

let getTuData = async function (id) {
    let query="select nam as nam "+
        "from zvd_get_tu_var((select dat_part from parti where id = $1 ), "+
        "(select id_el from parti where id = $1 ), "+
        "(select d.id from diam as d where d.diam = (select diam from parti where id = $1 )), "+
        "(select id_var from parti where id = $1 ) ) ";
    const data = await db.any(query, [ Number(id)] );
    return data;
}

module.exports.getHeaderData = getHeaderData;
module.exports.getTuData = getTuData;