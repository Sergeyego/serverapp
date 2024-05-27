const kamin = require("../../odata/kamin");
const db = require('../../postgres.js');

let syncInf = async function () {
    const headreq = "InformationRegister_КадровыеСведения?$filter=Recorder_Type ne 'StandardODATA.Document_ИзменениеСтавок'&$select=Recorder_Type,RecordSet/Period,RecordSet/Организация_Key,RecordSet/Сотрудник_Key,RecordSet/Должность_Key,RecordSet/Подразделение_Key,RecordSet/СтатусРаботы_Key,RecordSet/ТабНомер";
    const head = await kamin.sendReq(headreq, "GET");
    if (head.ok && head.object.length) {
        await db.any(
            "delete from kamin_inf where (typ, dat, id_org, id_empl, id_job, id_sub, id_stat, tabel) "+
            "not in ( "+
            "(select  substring(\"Recorder_Type\" from 24), (\"RecordSet\"->0->>'Period')::date, "+
            "\"RecordSet\"->0->>'Организация_Key', \"RecordSet\"->0->>'Сотрудник_Key', "+
            "\"RecordSet\"->0->>'Должность_Key', \"RecordSet\"->0->>'Подразделение_Key', "+ 
            "\"RecordSet\"->0->>'СтатусРаботы_Key', (\"RecordSet\"->0->>'ТабНомер')::integer "+
            "from ( "+
            "select * from jsonb_to_recordset(($1)::jsonb) "+
            "as t (\"Recorder_Type\" varchar, \"RecordSet\" jsonb) "+
            ") as z) "+
            ")"
            , [JSON.stringify(head.object)]);
        await db.any(
            "insert into kamin_inf (typ, dat, id_org, id_empl, id_job, id_sub, id_stat, tabel) " +
            "(select  substring(\"Recorder_Type\" from 24), (\"RecordSet\"->0->>'Period')::date, " +
            "\"RecordSet\"->0->>'Организация_Key', \"RecordSet\"->0->>'Сотрудник_Key', " +
            "\"RecordSet\"->0->>'Должность_Key', \"RecordSet\"->0->>'Подразделение_Key', " +
            "\"RecordSet\"->0->>'СтатусРаботы_Key', (\"RecordSet\"->0->>'ТабНомер')::integer " +
            "from ( " +
            "select * from jsonb_to_recordset(($1)::jsonb) " +
            "as t (\"Recorder_Type\" varchar, \"RecordSet\" jsonb) " +
            ") as z) on conflict do nothing"
            , [JSON.stringify(head.object)])
    }
    return head;
};

let syncEmpl = async function () {
    const headreq = "InformationRegister_ФИОСотрудников/SliceLast()?$select=Сотрудник_Key,Фамилия,Имя,Отчество,Сотрудник/Description,Сотрудник/Code,Сотрудник/ДатаРождения,Сотрудник/Пол,Сотрудник/ИНН,Сотрудник/СтраховойНомерПФ,Сотрудник/ПолисОМС&$expand=Сотрудник";
    const head = await kamin.sendReq(headreq, "GET");
    if (head.ok && head.object.length) {
        await db.any(
            "insert into kamin_empl (id, surname, first_name, middle_name, dob, sex) " +
            "( " +
            "select \"Сотрудник_Key\", \"Фамилия\", \"Имя\", \"Отчество\", " +
            "(\"Сотрудник\"->>'ДатаРождения')::date, \"Сотрудник\"->>'Пол' " +
            "from ( " +
            "select * from jsonb_to_recordset(($1)::jsonb) " +
            "as t (\"Сотрудник\" jsonb, \"Сотрудник_Key\" varchar, \"Фамилия\" varchar, \"Имя\" varchar, \"Отчество\" varchar) " +
            ") as g " +
            ") on conflict (id) do update set surname = EXCLUDED.surname, " +
            "first_name=EXCLUDED.first_name, middle_name=EXCLUDED.middle_name, " +
            "dob=EXCLUDED.dob, sex=EXCLUDED.sex", [JSON.stringify(head.object)])
    }
    return head;
};

let syncStat = async function () {
    const headreq = "Catalog_СтатусыРаботы?$select=Ref_Key,Description,Code";
    const head = await kamin.sendReq(headreq, "GET");
    if (head.ok && head.object.length) {
        await db.any(
            "insert into kamin_stat (id,nam,code)( " +
            "select * from jsonb_to_recordset(($1)::jsonb) " +
            "as t (\"Ref_Key\" varchar, \"Description\" varchar, \"Code\" varchar) " +
            ") on conflict (id) do update set nam = EXCLUDED.nam, code=EXCLUDED.code"
            , [JSON.stringify(head.object)])
    }
    return head;
};

let syncJob = async function () {
    const headreq = "Catalog_Должности?$select=Ref_Key,Code,Description&$filter=IsFolder eq 'false'";
    const head = await kamin.sendReq(headreq, "GET");
    if (head.ok && head.object.length) {
        await db.any(
            "insert into kamin_job (id,nam,code)( " +
            "select * from jsonb_to_recordset(($1)::jsonb) " +
            "as t (\"Ref_Key\" varchar, \"Description\" varchar, \"Code\" varchar) " +
            ") on conflict (id) do update set nam = EXCLUDED.nam, code=EXCLUDED.code"
            , [JSON.stringify(head.object)])
    }
    return head;
};

let syncSub = async function () {
    const headreq = "Catalog_Подразделения?&$select=Ref_Key,Code,Description,Parent_Key";
    const head = await kamin.sendReq(headreq, "GET");
    if (head.ok && head.object.length) {
        await db.any(
            "insert into kamin_sub (id,nam,code,id_parent)( " +
            "select * from jsonb_to_recordset(($1)::jsonb) " +
            "as t (\"Ref_Key\" varchar, \"Description\" varchar, \"Code\" varchar, \"Parent_Key\" varchar) " +
            ") on conflict (id) do update set nam = EXCLUDED.nam, code=EXCLUDED.code, id_parent=EXCLUDED.id_parent"
            , [JSON.stringify(head.object)])
    }
    return head;
};

let syncOrg = async function () {
    const headreq = "Catalog_Организации?&$select=Ref_Key,Code,Description,ИНН,КПП,НаименованиеПолное,НаименованиеСокращенное";
    const head = await kamin.sendReq(headreq, "GET");
    if (head.ok && head.object.length) {
        await db.any(
            "insert into kamin_org (id,nam,short,inn,kpp,code)( " +
            "select * from jsonb_to_recordset(($1)::jsonb) " +
            "as t (\"Ref_Key\" varchar, \"НаименованиеПолное\" varchar, \"НаименованиеСокращенное\" varchar, \"ИНН\" varchar, \"КПП\" varchar, \"Code\" varchar) " +
            ") on conflict (id) do update set nam = EXCLUDED.nam, short = EXCLUDED.short, inn = EXCLUDED.inn, kpp = EXCLUDED.kpp, code=EXCLUDED.code"
            , [JSON.stringify(head.object)])
    }
    return head;
};

let syncAll = async function () {
    let err = "";
    let ok = false;
    const org = await syncOrg();
    if (org.ok) {
        const sub = await syncSub();
        if (sub.ok) {
            const job = await syncJob();
            if (job.ok) {
                const stat = await syncStat();
                if (stat.ok) {
                    const empl = await syncEmpl();
                    if (empl.ok) {
                        const inf = await syncInf();
                        if (inf.ok) {
                            ok = true;
                        } else {
                            err = inf.error;
                        }
                    } else {
                        err = empl.error;
                    }
                } else {
                    err = stat.error;
                }
            } else {
                err = job.error;
            }
        } else {
            err = sub.error;
        }
    } else {
        err = org.error;
    }
    return { error: err, ok: ok };
}

module.exports = function (app) {
    app.get("/rab/sync/", async (req, res) => {
        syncAll()
            .then((rez) => {
                if (rez.ok) {
                    res.send("Синхронизировано успешно!");
                } else {
                    res.status(500).type("text/plain");
                    res.send(rez.error);
                }
            })
            .catch((error) => {
                console.log("SYNC ERROR:", error);
                res.status(500).type("text/plain");
                res.send(error.message);
            })
    });

}

module.exports.syncAll = syncAll;