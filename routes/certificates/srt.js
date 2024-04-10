let getGeneralData = async function (dat) {
    const db = require('../../postgres.js');
    let query = "select adr as adr, telboss||', '||telfax||', '||teldop||' '||site||' '||email as tel, "+
        "otk as otk, adr_en as adr_en, otk_en as otk_en, otk_title as otk_title, otk_title_en as otk_title_en "+
        "from general_data where dat = (select max(mgd.dat) from general_data mgd where mgd.dat <= $1 )";
    const data = await db.one(query, [dat] );
    return data;
}

let insText = function(lang, rus, eng, newpar=false) {
    let text="";
    if (typeof lang == "undefined" || lang=="ru" || rus==eng){
        if (rus!=null) {
            text=rus;
        }
    } else if (lang=="en"){
        if (eng!=null && eng!=""){
            text=eng;
        } else if (rus!=null){
            text=rus;
        }
    } else {
        if (rus!=null){
            text=rus+" / ";
        }
        if (newpar){
            text+="<br>";
        }
        if (eng!=null){
            text+=eng;
        }
    }
    return text;
}

let insNumber = function (lang, val, dec){
    let lg = (typeof lang == "undefined" || lang=="ru") ? "ru" : "en";
    return val!=null ? new Intl.NumberFormat(lg, {style: "decimal", minimumFractionDigits : dec}).format(val) : "";
}

let insDate = function (lang, date, newpar=false){
    let str;
    if (typeof lang == "undefined" || lang=="ru"){
        let formatter = new Intl.DateTimeFormat("ru");
        str=formatter.format(date);  
    } else if (lang=="en") {
        let formatter = new Intl.DateTimeFormat("en",{
            year: "numeric",
            month: "short",
            day: "numeric"
        });
        str=formatter.format(date);
    } else {
        let formatter1 = new Intl.DateTimeFormat("ru",{
            year: "numeric",
            month: "short",
            day: "numeric"
        });
        let formatter2 = new Intl.DateTimeFormat("en",{
            year: "numeric",
            month: "short",
            day: "numeric"
        });
        str=formatter1.format(date)+" / ";
        if (newpar){
            str+="<br>";
        }
        str+=formatter2.format(date);
    }
    return str;
}

let getChemTbl = function(lang, title, chemdata){
    let tbl='';
    if (chemdata.length){
        tbl='<table class="tablestyle" border="1" cellspacing="1" cellpadding="3">'+
                '<tr class="boldtext">'+
                    '<td colspan="'+chemdata.length+'" class="centeralign">'+title+'</td>'+
                '</tr>'+
                '<tr>';
                for (let i=0; i<chemdata.length; i++){
                    tbl+='<td class="centeralign">'+chemdata[i].sig+'</td>';
                }
        tbl+='</tr>'+
            '<tr>';
            for (let i=0; i<chemdata.length; i++){
                tbl+='<td class="centeralign">'+insNumber(lang,chemdata[i].val,3)+'</td>';
            }
        tbl+='</tr>'+
            '</table>';
    }
    return tbl;
}

let getMechTbl = function(lang, titleru, titleen, mechdata, footer=null){
    let tbl='';
    if (mechdata.length){
        let id_cat_old=-1;
        tbl='<table class="tablestyle" border="1" cellspacing="1" cellpadding="3">';
        for (let i=0; i<mechdata.length; i++){
            let id_cat=mechdata[i].id_cat;
            if (id_cat!=id_cat_old){
                let title = id_cat_old<0 ? insText(lang,titleru+" "+mechdata[i].catnam,titleen+" "+mechdata[i].catnam_en,true) :
                    insText(lang,mechdata[i].catnam,mechdata[i].catnam_en,true);                
                tbl+='<tr class="boldtext">'+
                    '<td colspan="3" class="centeralign">'+title+'</td>'+
                    '</tr>';
            }
            let prefix = insText(lang,mechdata[i].prefix,mechdata[i].prefix_en,true);
            let val = insNumber(lang,mechdata[i].val,2);
            if (prefix.length){
                val=prefix+" "+val;
            }
            tbl+='<tr>'+
                '<td width="80%" class="leftalign">'+insText(lang,mechdata[i].nam,mechdata[i].nam_en,true)+'</td>'+
                '<td class="centeralign">'+insText(lang,mechdata[i].sig,mechdata[i].sig_en,true)+'</td>'+
                '<td class="rightalign">'+val+'</td>'+
                '</tr>';
            id_cat_old=id_cat;
        }
        if (footer!=null){
            tbl+='<tr>'+
                '<td colspan="3" class="leftalign">'+footer+'</td>'+
                '</tr>';
        }
        tbl+='</table>';
    }
    return tbl;
}

let getSertTbl = function(lang, sertdata){
    let tbl='';
    if (sertdata.length){
        tbl+='<table class="tablestyle" border="1" cellspacing="1" cellpadding="3">'+
            '<tr class="boldtext">'+
                '<td class="centeralign">'+insText(lang,"Вид документа","Type of document",true)+'</td>'+
                '<td class="centeralign">'+insText(lang,"Сертифицирующий орган","Certification authority",true)+'</td>'+
                '<td class="centeralign">'+insText(lang,"Номер документа","Document Number",true)+'</td>'+
                '<td class="centeralign">'+insText(lang,"Дата выдачи","Date of issue",true)+'</td>'+
            '</tr>';
        for (let i=0; i<sertdata.length; i++){
            tbl+='<tr>'+
                '<td class="centeralign">'+insText(lang,sertdata[i].doc_nam,sertdata[i].doc_nam_en,true)+'</td>'+
                '<td class="centeralign">'+insText(lang,sertdata[i].ved_nam,sertdata[i].ved_nam_en,true)+'</td>'+
                '<td class="centeralign">'+sertdata[i].nom_doc+'</td>'+
                '<td class="centeralign">'+insDate(lang,sertdata[i].dat_doc,true)+'</td>'+
            '</tr>';
        }
        tbl+='</table>';
    }
    return tbl;
}

module.exports.getGeneralData = getGeneralData;
module.exports.insText = insText;
module.exports.insNumber = insNumber;
module.exports.insDate = insDate;
module.exports.getChemTbl = getChemTbl;
module.exports.getMechTbl = getMechTbl;
module.exports.getSertTbl = getSertTbl;