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
    app.get("/qrcode/qr.png", async (req, res) => {
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
                    width: 300,
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
}

module.exports.encodeBase64Url = encodeBase64Url;
module.exports.decodeBase64Url = decodeBase64Url;