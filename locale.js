let insNumber = function (val, dec){
    if (dec!=0){
        return val!=null ? new Intl.NumberFormat("ru-RU", {style: "decimal", minimumFractionDigits : dec, maximumFractionDigits : dec}).format(val) : "";
    } else {
        return val!=null ? new Intl.NumberFormat("ru-RU", {style: "decimal", minimumFractionDigits : dec }).format(val) : "";
    }
}

let insDate = function (dat){
    let dateoptions = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
    };
    return new Intl.DateTimeFormat("ru-RU",dateoptions).format(dat);
}

let insDateLong = function (dat){
    let dateoptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
    };
    return new Intl.DateTimeFormat("ru-RU",dateoptions).format(dat);
}

let insDateTime = function (dtm) {
    let dateoptions = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
    };
    return new Intl.DateTimeFormat("ru-RU",dateoptions).format(dtm);
}

module.exports.insNumber = insNumber;
module.exports.insDate = insDate;
module.exports.insDateLong = insDateLong;
module.exports.insDateTime = insDateTime;