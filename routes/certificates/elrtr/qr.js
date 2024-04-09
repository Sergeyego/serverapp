module.exports = function (app) {
    const qrcode = require('qrcode');
    const stream = require('stream');
    const header = require('./data.js');
    const { PassThrough }  = stream;
    app.get("/certificates/elrtr/ship/:shipId/qr.png", async (req, res) => {        
        const qrStream = new PassThrough();
        header.getHeaderData(Number(req.params['shipId']))
        .then((data)=>{
            qrcode.toFileStream(qrStream, data.marka,
                {
                    type: 'image/png',
                    width: 200,
                    errorCorrectionLevel: 'Q',
                    margin: 1
                });
                qrStream.pipe(res);
            })
        .catch((error) => {
            console.log('ERROR:', error);
            res.status(500).type('text/plain');
            res.send(error.message);
        }) 
    })
}