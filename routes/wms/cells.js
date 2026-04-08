const warehouse = require("../../odata/warehouse");

module.exports = function (app) {
    app.get("/wms/cells/", async (req, res) => {
        const cellreq = "Catalog_усЯчейки?$expand=Зона&$select=Code,Стеллаж,Ярус,Позиция,СтатусЯчейки,Штрихкод,Зона/Description&$orderby=Code asc";
        const dat = await warehouse.sendReq(cellreq, "GET");
        if (dat.ok && dat.object.length) {
            let arr = new Array();
            dat.object.forEach(function (dt) {
                let inf = {
                    'name': dt['Code'],
                    'rack': dt['Стеллаж'],
                    'position': dt['Позиция'],
                    'tier': dt['Ярус'],
                    'status': dt['СтатусЯчейки'],
                    'barcode': dt['Штрихкод'],
                    'zone': dt['Зона']['Description'],
                };
                arr.push(inf);
            });
            res.json(arr);
        } else {
            if (!dat.ok) {
                res.status(500).type("text/plain");
                res.send(dat.error);
            } else {
                res.send("");
            }
        }
    });
}