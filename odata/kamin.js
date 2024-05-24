const fetch = require("node-fetch");

let sendReq = async function(path, method, body){

    let err="";
    let  ok=false;
    let jsonObj;

    const auth=String("Кадровик:");
    const auth64 = Buffer.from(auth).toString('base64');

    const headers = new fetch.Headers({
        "Accept" : "application/json",
        "Accept-Charset" : "UTF-8",
        "Content-Type" : "application/json",
        "User-Agent" : "Appszsm",
        "Authorization" : "Basic "+auth64,
        "body": JSON.stringify(body),
    });
    
    let url='http://192.168.1.110/kamin/odata/standard.odata/'+path;
     
    try {
        let response = await fetch(url,{
            method: method,
            headers
        });

        if (response.headers.get('Content-Type').indexOf('application/json')>=0){
            jsonObj = await response.json();
            if (response.ok) {                    
                ok=true;
            } else {              
                err=jsonObj['odata.error']['message']['value'];
            }
        } else {
            err = await response.text();
        }
    } catch (error) {
        err=error.message;
    }
    return {object: jsonObj['value'], error: err, ok: ok};
}

module.exports.sendReq = sendReq;
