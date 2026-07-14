const warehouse = require("../../odata/warehouse");
const db = require("../../postgres.js");

let getKeys = async function (obj, key, val) {
    const dat = await warehouse.sendReq(obj + "?$select=" + key + "," + val, "GET");
    //console.log(dat);
    let map = new Map();
    if (dat.ok && dat.object.length) {
        dat.object.forEach(function (d) {
            map.set(d[key], d[val]);
        });
    }
    return map;
}

let joinDb = async function (dat,s_only) {
    const flt = s_only? "where t.zone in (select nam from warehouse_zone where id in (select distinct id_zone from warehouse_zone_ot)) " : "";
    const rez = await db.any("select t.prefix, t.id_kis, t.name, t.part, " +
        "(CASE WHEN p.id_var<>1 THEN '/'||ev.nam ||'/ ' ELSE '' END || coalesce(p.prim_prod,'')) || " +
        "(CASE WHEN wp.id_var<>1 THEN '/'||ev2.nam ||'/ ' ELSE '' END || coalesce(wp.prim_prod,'')) as prim, " +
        "coalesce(ep.pack_ed,wp2.pack_ed) as pack, " +
        "t.ist, t.zone, t.rcpplav, t.id_part, t.cell, t.cont, t.kvo, t.prich, t.rasch " +
        "from jsonb_to_recordset(($1)::jsonb) " +
        "as t (\"prefix\" varchar, \"id_kis\" varchar, \"name\" varchar, \"part\" varchar, \"ist\" varchar, \"zone\" varchar, " +
        "\"rcpplav\" varchar, \"id_part\" integer, \"cell\" varchar, \"cont\" varchar, \"kvo\" double precision, \"prich\" double precision, \"rasch\" double precision ) " +
        "left join parti p on p.id=t.id_part and t.prefix='e' " +
        "left join el_pack ep on ep.id = p.id_pack " +
        "left join elrtr_vars ev on ev.id=p.id_var " +
        "left join wire_parti wp on wp.id=t.id_part and t.prefix='w' " +
        "left join wire_pack wp2 on wp2.id = wp.id_pack_type " +
        "left join elrtr_vars ev2 on ev2.id = wp.id_var " +
        flt +
        "order by t.prefix, t.name, t.part", [JSON.stringify(dat)]);
    return rez;
}

module.exports = function (app) {
    app.get("/wms/balance/:dat/", async (req, res) => {
        const balreq = "AccumulationRegister_усОстаткиТоваров/Balance(Period=datetime'" + req.params["dat"] + "T23:59:59')?$expand=КлючАналитикиУчетаНоменклатуры/*" +
            "&$select=КлючАналитикиУчетаНоменклатуры/Номенклатура/КодКИС,КлючАналитикиУчетаНоменклатуры/Номенклатура/Description," +
            "КлючАналитикиУчетаНоменклатуры/ПартияНоменклатуры/КодКис,КлючАналитикиУчетаНоменклатуры/ПартияНоменклатуры/Description," +
            "КлючАналитикиУчетаНоменклатуры/ПартияНоменклатуры/РецептураПлавка,КлючАналитикиУчетаНоменклатуры/ПартияНоменклатуры/Комментарий," +
            "КлючАналитикиУчетаНоменклатуры/ПартияНоменклатуры/Источник_Key,Контейнер_Key," +
            "КоличествоBalance,КоличествоПриходBalance,КоличествоРасходBalance";
        const zons = await getKeys("Catalog_усЗоны", "Ref_Key", "Description");
        const ists = await getKeys("Catalog_усИсточникиПартий", "Ref_Key", "Description");
        const bal = await warehouse.sendReq(balreq, "GET");
        const s_only = (typeof req.query.getall=="undefined" || req.query.getall=="false");
        if (bal.ok && bal.object.length) {
            const contreq = "AccumulationRegister_усПоложениеКонтейнеров/Balance(Period=datetime'" + req.params["dat"] + "T23:59:59')" +
                "?$expand=Ячейка,Контейнер&$select=Контейнер_Key,Ячейка,Контейнер/Description,КоличествоBalance,КоличествоПриходBalance,КоличествоРасходBalance";
            const cont = await warehouse.sendReq(contreq, "GET");
            if (cont.ok && cont.object.length) {
                let mapCont = new Map();
                cont.object.forEach(function (cnt) {
                    let inf = {
                        'zone_key': cnt['Ячейка_Expanded']['Зона_Key'],
                        'name': cnt['Контейнер']['Description'],
                        'cell': cnt['Ячейка_Expanded']['Code'],
                        'kvo': cnt['КоличествоBalance'],
                        'prich': cnt['КоличествоПриходBalance'],
                        'rasch': cnt['КоличествоРасходBalance'],
                    };
                    mapCont.set(cnt['Контейнер_Key'], inf);
                });
                let arr = new Array();
                bal.object.forEach(function (bl) {
                    const id_kis_part = bl['КлючАналитикиУчетаНоменклатуры']['ПартияНоменклатуры']['КодКис'];
                    const words = id_kis_part.split(":");
                    const id_part = Number(words[1]);
                    const cnt = mapCont.get(bl['Контейнер_Key']);
                    let rasch = 0.0;
                    const crasch = Number(cnt['rasch']);
                    if (crasch > 0.0) {
                        rasch = Number(bl['КоличествоBalance']);
                    } else {
                        rasch = Number(bl['КоличествоРасходBalance']);
                    }
                    let inf = {
                        'prefix': words[0],
                        'id_kis': bl['КлючАналитикиУчетаНоменклатуры']['Номенклатура']['КодКИС'],
                        'name': bl['КлючАналитикиУчетаНоменклатуры']['Номенклатура']['Description'],
                        'part': bl['КлючАналитикиУчетаНоменклатуры']['ПартияНоменклатуры']['Description'],
                        'ist': ists.get(bl['КлючАналитикиУчетаНоменклатуры']['ПартияНоменклатуры']['Источник_Key']),
                        'zone': zons.get(cnt['zone_key']),
                        'rcpplav': bl['КлючАналитикиУчетаНоменклатуры']['ПартияНоменклатуры']['РецептураПлавка'],
                        'id_part': id_part,
                        'cell': cnt['cell'],
                        'cont': cnt['name'],
                        'kvo': Number(bl['КоличествоBalance']),
                        'prich': Number(bl['КоличествоПриходBalance']),
                        'rasch': rasch,
                    };

                    arr.push(inf);
                });
                joinDb(arr,s_only)
                    .then((data) => {
                        res.json(data);
                    })
                    .catch((error) => {
                        //console.log('ERROR:', error);
                        res.status(500).type('text/plain');
                        res.send(error.message);
                    })
            } else {
                if (!cont.ok) {
                    res.status(500).type("text/plain");
                    res.send(cont.error);
                } else {
                    res.send("");
                }
            }
        } else {
            if (!bal.ok) {
                res.status(500).type("text/plain");
                res.send(bal.error);
            } else {
                res.send("");
            }
        }
    });
}