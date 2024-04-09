let getGeneralData = async function (dat) {
    const db = require('../../postgres.js');
    let query = "select adr as adr, telboss||', '||telfax||', '||teldop||' '||site||' '||email as tel, "+
        "otk as otk, adr_en as adr_en, otk_en as otk_en, otk_title as otk_title, otk_title_en as otk_title_en "+
        "from general_data where dat = (select max(mgd.dat) from general_data mgd where mgd.dat <= $1 )";
    const data = await db.one(query, [dat] );
    return data;
}

let insText = function(lang, rus, eng, newpar=false) {
    let text;
    if (typeof lang == "undefined" || lang=='ru'){
        text=rus;
    } else if (lang=="en"){
        text=eng;
    } else {
        text=rus+" / ";
        if (newpar){
            text+="<br>";
        }
        text+=eng;
    }
    return text;
}

module.exports.getGeneralData = getGeneralData;
module.exports.insText = insText;