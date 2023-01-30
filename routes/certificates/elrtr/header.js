let getHeaderData = async function (id, is_ship=true, is_sample=false) {
    const db = require('../../../postgres.js');
    const data = await db.one("select p.id as id_part, p.n_s as npart, p.yea as year_part, p.dat_part as dat_part, e.marka_sert as marka, p.diam as diam, "+
        "gt.nam as gost_type, pu.nam as posfix, coalesce (p.ibco, ev.znam) as znam, coalesce(pr.nam, v.nam) as provol, pol.naim as pol, "+
        "s.nom_s as noms, s.dat_vid as datvid, o.massa as kvo, pol.naim_en as pol_en "+
        "from otpusk as o "+
        "inner join sertifikat as s on o.id_sert=s.id "+
        "inner join parti as p on o.id_part=p.id "+
        "inner join elrtr as e on e.id=p.id_el "+
        "inner join provol as v on v.id=e.id_gost "+
        "inner join poluch as pol on s.id_pol=pol.id "+
        "inner join gost_types as gt on e.id_gost_type=gt.id "+
        "inner join purpose as pu on e.id_purpose=pu.id "+
        "left join el_var ev on ev.id_el = p.id_el and ev.id_var = p.id_var "+
        "left join provol as pr on pr.id = ev.id_prov "+
        "where o.id = $1", [ Number(id) ] );
    return data;
}
module.exports = {getHeaderData};