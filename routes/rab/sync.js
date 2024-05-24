const kamin = require("../../odata/kamin");
const db = require('../../postgres.js');

let syncEmpl = async function(){
    const headreq = "InformationRegister_ФИОСотрудников/SliceLast()?$select=Сотрудник_Key,Фамилия,Имя,Отчество,Сотрудник/Description,Сотрудник/Code,Сотрудник/ДатаРождения,Сотрудник/Пол,Сотрудник/ИНН,Сотрудник/СтраховойНомерПФ,Сотрудник/ПолисОМС&$expand=Сотрудник";
    const head = await kamin.sendReq(headreq,"GET");
    if (head.ok && head.object.length){
        await db.any(
        "insert into kamin_empl (id, surname, first_name, middle_name, dob, sex) "+
        "( "+
        "select \"Сотрудник_Key\", \"Фамилия\", \"Имя\", \"Отчество\", "+
        "(\"Сотрудник\"->>'ДатаРождения')::date, \"Сотрудник\"->>'Пол' "+
        "from ( "+
        "select * from jsonb_to_recordset(($1)::jsonb) "+
        "as t (\"Сотрудник\" jsonb, \"Сотрудник_Key\" varchar, \"Фамилия\" varchar, \"Имя\" varchar, \"Отчество\" varchar) "+
        ") as g "+
        ") on conflict (id) do update set surname = EXCLUDED.surname, "+
        "first_name=EXCLUDED.first_name, middle_name=EXCLUDED.middle_name, "+
        "dob=EXCLUDED.dob, sex=EXCLUDED.sex",[JSON.stringify(head.object)])
    }
    return head;
};

let syncInf = async function(){
    const headreq = "InformationRegister_КадровыеСведения?$filter=Recorder_Type ne 'StandardODATA.Document_ИзменениеСтавок'&$select=Recorder_Type,RecordSet/Period,RecordSet/Организация_Key,RecordSet/Сотрудник_Key,RecordSet/Должность_Key,RecordSet/Подразделение_Key,RecordSet/СтатусРаботы_Key,RecordSet/ТабНомер";
    const head = await kamin.sendReq(headreq,"GET");
    if (head.ok && head.object.length){
        await db.any(
            "insert into kamin_inf (typ, dat, id_org, id_empl, id_job, id_sub, id_stat, tabel) "+
            "(select  substring(\"Recorder_Type\" from 24), (\"RecordSet\"->0->>'Period')::date, "+
            "\"RecordSet\"->0->>'Организация_Key', \"RecordSet\"->0->>'Сотрудник_Key',"+
            "\"RecordSet\"->0->>'Должность_Key', \"RecordSet\"->0->>'Подразделение_Key', "+
            "\"RecordSet\"->0->>'СтатусРаботы_Key', (\"RecordSet\"->0->>'ТабНомер')::integer "+
            "from ( "+
            "select * from jsonb_to_recordset(($1)::jsonb) "+
            "as t (\"Recorder_Type\" varchar, \"RecordSet\" jsonb) "+
            ") as z) on conflict do nothing"
        ,[JSON.stringify(head.object)]) 
    }
    return head;
};

module.exports = function (app) {
    app.get("/rab/sync/", async (req, res) => {

        //const headreq = "Catalog_Организации?&$select=Ref_Key,Code,Description,ИНН,КПП,НаименованиеПолное,НаименованиеСокращенное,ОГРН,ОКВЭД,ОКТМО";
        //const headreq = "Catalog_Подразделения?&$select=Ref_Key,Code,Description,Parent_Key&$orderby=Parent_Key asc";
        //const headreq = "Catalog_Должности?$select=Ref_Key,Code,Description,КодПоОКПДТР,Категория_Key,Категория/PredefinedDataName&$filter=IsFolder eq 'false'&$expand=Категория";
        //const headreq = "InformationRegister_ФИОСотрудников/SliceLast()?$select=Сотрудник_Key,Фамилия,Имя,Отчество,Сотрудник/Description,Сотрудник/Code,Сотрудник/ДатаРождения,Сотрудник/Пол,Сотрудник/ИНН,Сотрудник/СтраховойНомерПФ,Сотрудник/ПолисОМС&$expand=Сотрудник";
        //const headreq = "Catalog_СтатусыРаботы?$select=Ref_Key,Description";
        //const headreq = "InformationRegister_КадровыеСведения?$filter=Recorder_Type ne 'StandardODATA.Document_ИзменениеСтавок'&$select=Recorder_Type,RecordSet/Period,RecordSet/Организация_Key,RecordSet/Сотрудник_Key,RecordSet/Должность_Key,RecordSet/Подразделение_Key,RecordSet/СтатусРаботы_Key,RecordSet/ТабНомер";
        
        /*const head = await kamin.sendReq(headreq,"GET");
        if (head.ok && head.object.length){
            res.json(head.object)

        } else {
            if (!head.ok){
                res.status(500).type("text/plain");
                res.send(head.error);
            } else {
                res.send("");
            }
        }*/
        syncEmpl()
        .then((rezE)=>{
            if (rezE.ok){
                syncInf()
                .then((rezI)=>{
                    if (rezI.ok){
                        syncInf()
                        res.send("ok")
                    } else {
                        res.status(500).type("text/plain");
                        res.send(rezI.error);
                    }
                })
                .catch((error) => {
                    console.log("INF ERROR:", error);
                    res.status(500).type("text/plain");
                    res.send(error.message);
                })
            } else {
                res.status(500).type("text/plain");
                res.send(rezE.error);
            }
        })
        .catch((error) => {
            console.log("ERROR:", error);
            res.status(500).type("text/plain");
            res.send(error.message);
        })
    });

    app.get("/rab/sync/:req", async (req, res) => {

        const headreq = "Catalog_Должности?$select=Ref_Key,Code,Description,КодПоОКПДТР,Категория_Key,Категория/PredefinedDataName&$filter=IsFolder eq 'false'&$expand=Категория";
        const head = await kamin.sendReq(req.params["req"]/*headreq*/,"GET");
        if (head.ok && head.object.length){
            res.json(head.object)
            /*try {
                headObj=head.object[0];
                res.json(headObj);
            } catch (error) {
                res.status(500).type("text/plain");
                res.send(error.message);
            }*/

        } else {
            //if (!head.ok){
                res.status(500).type("text/plain");
                res.send(head.error);
            //} else {
            //    res.send("");
            //}
        }
    });
 }
