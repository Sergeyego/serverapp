const {
    S3Client,
    PutObjectCommand,
    //DeleteObjectCommand,
    ListObjectsV2Command,
    //GetObjectCommand,
  } = require("@aws-sdk/client-s3");

const fs = require("node:fs/promises");
const sfs = require("node:fs");
const db = require('../../postgres.js');
const bodyParser = require('body-parser');
const { Poppler } = require("node-poppler");

const basepath = "/mnt/data/certificates/";
const bucketName = `643e48d8e338-quality-certificates`;

let syncFile = async function (fname, path) {
    const s3Client = new S3Client({});
    let err="";
    let  ok=false;
    try {
        await s3Client.send (
            new PutObjectCommand({
            Bucket: bucketName,
            Key: path,
            Body: await fs.readFile(fname),
            })
        );
        ok=true;
    } catch (error) {
        err=error.message;
    }
    return {error: err, ok: ok};
};

let syncAllFile = async function () {
    let err="";
    let  ok=false;
    try {
        let data = await db.any("select o.id, o.ds_status, o.hash  from otpusk o where o.ds_status = 1");
        for (let i=0; i<data.length; i++){
            var path = basepath+data[i].hash;
            let files = sfs.readdirSync(path);
            for (let j=0; j<files.length; j++){
                let filename=path+'/'+files[j];
                //console.log(filename);
                let rez = await syncFile(filename,data[i].hash+'/'+files[j]);
                if (rez.ok){
                    await db.any("update otpusk set ds_status=2 where id = $1",[ Number(data[i].id) ]);
                }
            }
        }
        ok=true;
    } catch (error) {
        err=error.message;
    }
    return {error: err, ok: ok};
};

module.exports = function (app) {

    app.post("/s3/local/:id/:lang",bodyParser.raw({ type: 'application/pdf', limit: '10mb'}), async (req, res) => {
        db.one("select o.ds_status, o.hash  from otpusk o where o.id = $1",[ Number(req.params["id"]) ]) 
            .then((data) => {
                let dir = basepath+data.hash;
                if (!sfs.existsSync(dir)) {
                    sfs.mkdirSync(dir, { recursive: true });
                }
                fs.writeFile(dir+"/"+String(req.params["id"])+"-"+String(req.params["lang"])+".pdf", req.body)
                    .then(() => {
                        db.any("update otpusk set ds_status=1 where id = $1",[ Number(req.params["id"]) ]) 
                            .then((data) => {
                                res.type('text/plain');
                                res.send('Успешно!');
                            })
                            .catch((error) => {
                                console.log('ERROR:', error);
                                res.status(500).type('text/plain');
                                res.send(error.message);
                            })
                    })
                    .catch((error) => {
                        console.log('ERROR:', error);
                        res.status(500).type('text/plain');
                        res.send(error.message);
                    })
            })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.get("/s3/local/:id/:lang", async (req, res) => {
        db.one("select o.ds_status, o.hash  from otpusk o where o.id = $1",[ Number(req.params["id"]) ]) 
            .then((data) => {
                var filename = basepath+data.hash+"/"+String(req.params["id"])+"-"+String(req.params["lang"])+".pdf";
                fs.access(filename)
                    .then(() => {
                        res.type('application/pdf');
                        sfs.createReadStream(filename).pipe(res);
                    }).catch((err) => {
                        res.type('text/plain');
                        res.send('');
                    });
            })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.get("/s3/img/:id/:lang/:dpi", async (req, res) => {
        db.one("select o.ds_status, o.hash  from otpusk o where o.id = $1",[ Number(req.params["id"]) ]) 
            .then((data) => {
                var filename = basepath+data.hash+"/"+String(req.params["id"])+"-"+String(req.params["lang"])+".pdf";
                fs.access(filename)
                    .then(() => {
                        let dpi = Number(req.params["dpi"]);
                        if (isNaN(dpi) || dpi<1 || dpi>1200){
                            dpi=150;
                        }
                        const poppler = new Poppler();
                        const options = {
                            firstPageToConvert: 1,
                            lastPageToConvert: 1,
                            pngFile: true,
                            singleFile: true,
                            resolutionXAxis: dpi,
                            resolutionYAxis: dpi,
                        };
                        poppler.pdfToCairo(filename, undefined, options)
                            .then((cont) => {
                                const buf = Buffer.from(cont,'binary');
                                res.type('image/png');
                                res.send(buf);
                            })
                            .catch((err) => {
                                console.error(err);
                                res.status(500).type('text/plain');
                                res.send(err.message);
                            });
                    }).catch((err) => {
                        res.type('text/plain');
                        res.send('');
                    });
            })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.get("/s3/status/:id/:lang", async (req, res) => {
        db.one("select o.ds_status, o.hash  from otpusk o where o.id = $1",[ Number(req.params["id"]) ]) 
            .then((data) => {
                var filename = basepath+data.hash+"/"+String(req.params["id"])+"-"+String(req.params["lang"])+".pdf";
                var ok = (data.ds_status>0 && sfs.existsSync(filename));
                res.type('text/plain');
                res.send(ok);
            })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
                res.send(error.message);
            })
    })

    app.get("/s3/sync", async (req, res) => {
        syncAllFile()
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
    })

    app.get("/s3/objects", async (req, res) => {
        const s3Client = new S3Client({});
        const command =
            new ListObjectsV2Command({
            Bucket: bucketName,
            MaxKeys: 10000
            //Prefix: "2025/"
        });
        try {
            let isTruncated = true;
            let contents = [];
            while (isTruncated) {
                const { Contents, IsTruncated, NextContinuationToken } = await s3Client.send(command);
                contents=contents.concat(Contents);
                isTruncated = IsTruncated;
                command.input.ContinuationToken = NextContinuationToken;
            }
            console.log(contents);
            res.json(contents);
        } catch (err) {
            console.log('ERROR:',err);
            res.status(500).type('text/plain');
            res.send(err.message);
        }
    })

    /*app.get("/s3/upload", async (req, res) => {
        const s3Client = new S3Client({});
        const filePath = "/home/sergey/license_certificate_2025.pdf";
        try {
            await s3Client.send (
                new PutObjectCommand({
                Bucket: bucketName,
                Key: "files/license_certificate_2025.pdf",
                Body: await fs.readFile(filePath),
                })
            );
            res.type('text/plain');
            res.send("ОК!");
        } catch (err) {
            console.log('ERROR:',err);
            res.status(500).type('text/plain');
            res.send(err.message);
        }
    })

    app.get("/s3/get", async (req, res) => {
        const s3Client = new S3Client({});
        try {
            const { Body } = await s3Client.send (
                new GetObjectCommand({
                Bucket: bucketName,
                Key: "2025/0086_2025_0216.pdf"
                })
            );
            //res.type('application/pdf');
            Body.pipe(res);
        } catch (err) {
            console.log('ERROR:',err);
            res.status(500).type('text/plain');
            res.send(err.message);
        }
    })

    app.get("/s3/delete", async (req, res) => {
        const s3Client = new S3Client({});
        try {
            await s3Client.send (
                new DeleteObjectCommand({
                Bucket: bucketName,
                Key: "files/license_certificate_2025.pdf"
                })
            );
            res.type('text/plain');
            res.send("ОК!");
        } catch (err) {
            console.log('ERROR:',err);
            res.status(500).type('text/plain');
            res.send(err.message);
        }
    })*/

}