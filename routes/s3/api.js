const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    //paginateListObjectsV2,
    ListObjectsV2Command,
    GetObjectCommand,
  } = require("@aws-sdk/client-s3");

const fs = require("node:fs/promises");
const sfs = require("node:fs");
const db = require('../../postgres.js');
const bodyParser = require('body-parser');

const basepath = "/mnt/data/certificates/";
const bucketName = `643e48d8e338-quality-certificates`;


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
                        res.send('Не найден подписанный сертификат!');
                    });
            })
            .catch((error) => {
                console.log('ERROR:', error);
                res.status(500).type('text/plain');
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

    app.get("/s3/upload", async (req, res) => {
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
    })

}