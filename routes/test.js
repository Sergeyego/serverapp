module.exports = function (app) {
    //const fs = require("fs");
    const docx = require("docx");
    const { Document, Packer, Paragraph, Table, TableCell, 
        TableRow, WidthType, PageOrientation, AlignmentType, 
        UnderlineType, TabStopPosition, convertInchesToTwip, HeadingLevel, BorderStyle, TableBorders, TabStopType, LineRuleType} = docx; 
    //const styles = fs.readFileSync("./routes/styles.xml", "utf-8");

    app.get("/test", async (req, res) => {

        const table1 = new Table({
            columnWidths: [7650, 1900, 1700],
            rows: [
                new TableRow({//1
                    children: [
                        new TableCell({
                            width: {
                                size: 7650,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "", style: "normalPara"})],
                            borders: TableBorders.NONE,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 1900,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "", style: "normalPara3"})],
                            borders: TableBorders.NONE,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 1700,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "Коды", style: "normalPara"})],
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                    ],
                }),
                new TableRow({//2
                    children: [
                        new TableCell({
                            width: {
                                size: 7650,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "Организация ООО Судиславский завод сварочных материалов", style: "normalPara"})],
                            borders: TableBorders.NONE,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 1900,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text:"Форма по ОКУД", style: "normalPara3"})],
                            borders: TableBorders.NONE,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),                      
                        new TableCell({
                            width: {
                                size: 1700,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "0315003", style: "normalPara"})],
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                    ],
                }),
                new TableRow({//3
                    children: [
                        new TableCell({
                            width: {
                                size: 7650,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "Структурное подразделение", style: "normalPara"})],
                            borders: TableBorders.NONE,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 1900,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "по ОКПО", style: "normalPara3"})],
                            borders: TableBorders.NONE,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 1700,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "", style: "normalPara"})],
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                    ],
                }),
            ],
        });

        const table2 = new Table({
            columnWidths: [1670, 680, 680, 5103, 850, 1134, 850, 1134, 1134, 1132, 680],
            rows: [
                new TableRow({ //1
                    children: [
                        new TableCell({
                            width: {
                                size: 1670,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "Дата составления", style: "tablePara"})],
                            rowSpan: 2,
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 680,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "Код вида операции", style: "tablePara"})],
                            rowSpan: 2,
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 680,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "Склад", style: "tablePara"})],
                            rowSpan: 2,
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 5103,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "Поставщик", style: "tablePara"})],
                            columnSpan: 2,
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 1134,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "Страховая компания", style: "tablePara"})],
                            rowSpan: 2,
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 850,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "Корреспондирующий счет", style: "tablePara"})],
                            columnSpan: 2,
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 1134,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "Номер документа", style: "tablePara"})],
                            columnSpan: 2,
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 680,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "", style: "tablePara"})],
                            rowSpan: 2,
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                    ],
                }),
                new TableRow({ //2
                    children: [
                        new TableCell({
                            width: {
                                size: 5103,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "Наименование", style: "tablePara"})],
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 850,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "Код", style: "tablePara"})],
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 850,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "счет, субсчет", style: "tablePara"})],
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 1134,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "код аналитического учета", style: "tablePara"})],
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 1134,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "сопроводительного", style: "tablePara"})],
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 1132,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "платежного", style: "tablePara"})],
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                    ],
                }),
                new TableRow({ //3
                    children: [
                        new TableCell({width: {
                            size: 1670,
                            type: WidthType.DXA,
                        },
                            children: [new Paragraph({text: "04 февраля 2022 г", style: "normalPara4"})],
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 680,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "", style: "normalPara4"})],
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 680,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "", style: "normalPara4"})],
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 5103,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "ОТГРУЗКА НА СКЛАД ЭЛЕКТРОДОВ", style: "normalPara4"})],
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 850,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "", style: "normalPara4"})],
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 1134,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "", style: "normalPara4"})],
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 850,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "", style: "normalPara4"})],
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 1134,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "", style: "normalPara4"})],
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 1134,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "", style: "normalPara4"})],
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 1132,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "", style: "normalPara4"})],
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                        new TableCell({
                            width: {
                                size: 680,
                                type: WidthType.DXA,
                            },
                            children: [new Paragraph({text: "", style: "normalPara4"})],
                            verticalAlign: AlignmentType.CENTER,
                            margins: {
                                top: 57,
                                bottom: 57,
                                left: 57,
                                right: 57,
                            },
                        }),
                    ],
                }),
            ],
        });

        const doc = new Document({
            styles: {
                default: {
                    heading1: {
                        run: {
                            font: "Arial",
                            size: 20,
                            bold: true,
                        },
                        paragraph: {
                            alignment: AlignmentType.CENTER,
                            spacing: { line: 340 },
                        },
                    },
                },
                paragraphStyles: [
                    {
                        id: "normalPara",
                        name: "Normal Para",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            font: "Arial",
                            size: 20,
                            bold: false,
                        },
                        paragraph: {
                            spacing: { lineRule: LineRuleType.AUTO, before: 0, after: 0 },
                            alignment: AlignmentType.LEFT,
                        },
                    },
                    {
                        id: "normalPara2",
                        name: "Normal Para2",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            font: "Arial",
                            size: 16,
                        },
                        paragraph: {
                            alignment: AlignmentType.RIGHT,
                            spacing: { lineRule: LineRuleType.AUTO, before: 0, after: 0 },
                        },
                    },
                    {
                        id: "normalPara3",
                        name: "Normal Para3",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            font: "Arial",
                            size: 20,
                            bold: false,
                        },
                        paragraph: {
                            spacing: { lineRule: LineRuleType.AUTO, before: 0, after: 0 },
                            alignment: AlignmentType.RIGHT,
                        },
                    },
                    {
                        id: "normalPara4",
                        name: "Normal Para4",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            font: "Arial",
                            size: 20,
                            bold: false,
                        },
                        paragraph: {
                            spacing: { lineRule: LineRuleType.AUTO, before: 0, after: 0 },
                            alignment: AlignmentType.CENTER,
                        },
                    },
                    {
                        id: "tablePara",
                        name: "Table Para",
                        basedOn: "Normal",
                        next: "Normal",
                        quickFormat: true,
                        run: {
                            font: "Arial",
                            size: 16,
                        },
                        paragraph: {
                            alignment: AlignmentType.CENTER,
                            spacing: { lineRule: LineRuleType.AUTO, before: 0, after: 0 },
                        },
                        
                    },
                ],
            },
            sections: [
                {
                    properties: {
                        page: {
                            size: {
                                orientation: PageOrientation.LANDSCAPE,
                            },
                            margin: {
                                top: 850,
                                bottom: 850,
                                left: 850,
                                right: 850,
                            },
                        },
                    },
                    children: [
                        new Paragraph({ text: "Типовая межотраслевая форма № М-4", style: "normalPara2"}),
                        new Paragraph({ text: "Утверждена Постановлением Госкомстата России", style: "normalPara2"}),
                        new Paragraph({ text: "от 30.10.1997 № 71а", style: "normalPara2"}),
                        new Paragraph({ text: "ТРЕБОВАНИЕ-НАКЛАДНАЯ № 35", heading: HeadingLevel.HEADING_1 }),
                        table1,
                        new Paragraph({text: "", style: "normalPara"}),
                        table2,
                        new Paragraph({text: "", style: "normalPara"}),
                        //table4,
                    ],
                },
            ],
        });

        const b64string = await Packer.toBase64String(doc);
        res.setHeader('Content-Disposition', 'attachment; filename=My Document.docx');
        res.send(Buffer.from(b64string, 'base64'));
        
    })
}
