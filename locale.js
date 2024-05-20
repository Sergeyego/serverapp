let insNumber = function (val, dec){
    if (dec!=0){
        return val!=null ? new Intl.NumberFormat("ru-RU", {style: "decimal", minimumFractionDigits : dec, maximumFractionDigits : dec}).format(val) : "";
    } else {
        return val!=null ? new Intl.NumberFormat("ru-RU", {style: "decimal", minimumFractionDigits : dec }).format(val) : "";
    }
}

module.exports.insNumber = insNumber;
