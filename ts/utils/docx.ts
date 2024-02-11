import fs from 'fs'
import libre from 'libreoffice-convert'
import Path from 'path'
import Docxtemplater from 'docxtemplater'
import PizZip from 'pizzip'
import createReport from 'docx-templates'
import sizeOf from 'image-size'
import htmlToDocx from "html-docx-js";


export default class DocxLib {
    static async PopulateDOCXTemplate(templatePath: string, data: any): Promise<Buffer> {
        for (const key in data) {
            data[key] = data[key] != undefined ? data[key] : ""
            data[key] = data[key] != null ? data[key] : ""
        }
        const start = new Date(Date.now())
        var template = fs.readFileSync(templatePath, 'binary') as any as Buffer
        const buf = await createReport({
            template, data,
            additionalJsContext: {
                buffer: (buffer: Buffer) => {
                    let { width = 1, height = 1 } = sizeOf(buffer)
                    const ratio = height / width
                    width = Math.min(width / 10, 17)
                    height = Math.floor(width * ratio)
                    const data = buffer.toString("base64")
                    return { width, height, data, extension: '.png' };
                },
            }
        });
        // const buf = doc.getZip().generate({ type: 'nodebuffer' });
        return Buffer.from(buf.buffer) //fs.readFileSync(tmpPath);
    }
    static PopulateDOCXTemplater(templatePath: string, data: any): Buffer {
        for (const key in data) {
            data[key] = data[key] != undefined ? data[key] : ""
            data[key] = data[key] != null ? data[key] : ""
        }
        const start = new Date(Date.now())
        var content = fs.readFileSync(templatePath, 'binary');
        var zip = new PizZip(content);
        var doc;
        doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
        doc.render(data)
        const buf = doc.getZip().generate({ type: 'nodebuffer' }) as Buffer
        return buf
    }
    static async HtmlToDocx(content: string, savePath?: string): Promise<Buffer> {
        const docxBuffer = await htmlToDocx.asBlob(content) as Buffer;
        return docxBuffer
    }
    static DocxToPdf(file: string | Buffer, savePath?: string): Promise<Buffer> {
        return new Promise(async (resolve, reject) => {
            const stack = new Error().stack
            try {
                const extend = '.pdf'
                let buffer: Buffer = (typeof file) == "string" ? fs.readFileSync(file) : file as Buffer
                libre.convert(buffer, extend, undefined, async (err, pdfBuffer) => {
                    if (err) { return reject(err) }
                    try {
                        if (savePath) {
                            const dirname = Path.dirname(savePath)
                            if (!fs.existsSync(dirname)) {
                                fs.mkdirSync(dirname, { recursive: true });
                            }
                            fs.writeFileSync(savePath, pdfBuffer);
                        }
                        return resolve(pdfBuffer)
                    } catch (error) { return reject(error) }
                });
            } catch (error) { reject(error) }
        })
    }
    static async PopulateDOCXTemplateToPDF(templatePath: string, savePath: string, data: any): Promise<Buffer> {
        const docxFile = await DocxLib.PopulateDOCXTemplate(templatePath, data)
        return await DocxLib.DocxToPdf(docxFile, savePath)
    }

    static async PopulateDOCXTemplaterToPDF(templatePath: string, savePath: string, data: any): Promise<Buffer> {
        const docxFile = DocxLib.PopulateDOCXTemplater(templatePath, data)
        return await DocxLib.DocxToPdf(docxFile, savePath)
    }

}

module.exports = DocxLib;