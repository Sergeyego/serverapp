const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    //paginateListObjectsV2,
    ListObjectsV2Command,
    GetObjectCommand,
  } = require("@aws-sdk/client-s3");

const fs = require("node:fs/promises");

const bucketName = `643e48d8e338-quality-certificates`;


module.exports = function (app) {
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