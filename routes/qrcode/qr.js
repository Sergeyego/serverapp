function encodeBase64Url(buffer) {
    return buffer.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '')
}
  
function decodeBase64Url(base64url) {
    const base64 = base64url
      .replace(/-/g, '+')
      .replace(/_/g, '/') 
    return Buffer.from(base64, 'base64')
}

module.exports = function (app) {
    const qrcode = require('qrcode');
    const stream = require('stream');
    const { PassThrough }  = stream;
    app.get("/qrcode/:width.png", async (req, res) => {
        let data = req.query.data;
        if (typeof data == "undefined"){
            res.status(500).type("text/plain");
            res.send("no data");
        } else {
            let qrdata = decodeBase64Url(data).toString();       
            const qrStream = new PassThrough();
            try {
                qrcode.toFileStream(qrStream, qrdata,
                {
                    type: 'image/png',
                    width: Number(req.params["width"]),
                    errorCorrectionLevel: 'M',
                    margin: 1
                });
                qrStream.pipe(res);
            } catch (error) {
                console.log("ERROR:", error);
                res.status(500).type("text/plain");
                res.send(error.message);
            }
        }
    })

    app.get("/barcode/:format/:width.png", async (req, res) => {        
        let data = req.query.data;
        let width=Number(req.params["width"])*0.264583;
        let height=10;
        let format=req.params["format"];
        if (format=="qrcode" || format=="datamatrix"|| format=="azteccode"|| format=="microqrcode" || format=="maxicode"){
            height=width;
        } else if ((typeof (req.query.height))!="undefined"){
            height=Number(req.query.height)*0.264583;
        }
        if (typeof data == "undefined"){
            res.status(500).type("text/plain");
            res.send("no data");
        } else {            
            const bwipjs = require('bwip-js');
            bwipjs.toBuffer({
                    bcid:        format,
                    text:        data,
                    scale:       3,
                    height:      height,
                    width:       width,
                    includetext: true,
                    textxalign:  'center',
                    textyoffset: 4,
                    textsize: 11,
                    textgaps: 0,    
                }).then(png => {
                    res.type('image/png');
                    res.send(png);
                })
                .catch(err => {
                    console.log("ERROR:", err);
                    res.status(500).type("text/plain");
                    res.send(err.message);
                });
        }
    })
}

module.exports.encodeBase64Url = encodeBase64Url;
module.exports.decodeBase64Url = decodeBase64Url;