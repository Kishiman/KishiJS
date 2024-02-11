const pdfUtil = require('pdf-to-text')
import pdfParse from 'pdf-parse'
import fs from 'fs'
import ejs from 'ejs'
import htmlPdf from 'html-pdf'
import Path from 'path'
import { pdfToPng } from 'pdf-to-png-converter'

import { randomUUID } from 'crypto';
import { compareStrings, fixFrenchDiacritics } from "../utils/string";
import { AbstractFile } from './file'
import DocxLib from './docx'
import { PDFExtract } from 'pdf.js-extract'
// const PDFExtract = require('pdf.js-extract').PDFExtract;



export class PDFLib {
  static async PdfToPages(pdfFile: Buffer | string): Promise<string[]> {
    let tempFilePath = "";

    if (pdfFile instanceof Buffer) {
      tempFilePath = `tmp/${randomUUID()}.pdf`;
      fs.writeFileSync(tempFilePath, pdfFile);
    } else {
      tempFilePath = pdfFile;
    }
    const pdfExtract = new PDFExtract();

    return new Promise(async (resolve, reject) => {
      let pages: string[] = []
      pdfExtract.extract(tempFilePath, {
        disableCombineTextItems: false
      }, (err, data) => {
        if (err)
          reject(err);
        else {
          pages = data!.pages.map(page => page.content.map(c => c.str || " ").join(""))
          resolve(pages)
        }
        if (pdfFile instanceof Buffer)
          fs.unlink(tempFilePath, () => { })
      });
    });
  }

  static async ExtractText(file: AbstractFile): Promise<string> {
    const extension = file.name.split(".").pop()
    if (extension == "docx") {
      const pdfData = await DocxLib.DocxToPdf(file.data)
      return await PDFLib.PdfToText(pdfData)
    } else if (extension == "pdf") {
      return await PDFLib.PdfToText(file.data)
    }
    throw `Unsupported file type ${extension}`
  }
  static async ExtractPages(file: AbstractFile): Promise<string[]> {
    const extension = file.name.split(".").pop()
    if (extension == "docx") {
      const pdfData = await DocxLib.DocxToPdf(file.data)
      return await PDFLib.PdfToPages(pdfData)
    } else if (extension == "pdf") {
      return await PDFLib.PdfToPages(file.data)
    }
    throw `Unsupported file type ${extension}`
  }
  // static async GetPageData(buffer) {
  //     const pageData = await pdfPageCounter(buffer).catch((error) => {
  //         console.error(error)
  //         return {
  //             numpages: 1,
  //             info: {},
  //             metadata: {},
  //             text: "",
  //             version: {},
  //         }
  //     })
  //     return pageData
  // }
  static async PdfToText(pdfFile: Buffer | string): Promise<string> {
    let tempFilePath = "";
    let jsonPath: string
    let textPath: string
    if (pdfFile instanceof Buffer) {
      let uuid = randomUUID()
      tempFilePath = `tmp/${uuid}.pdf`;
      jsonPath = `tmp/${uuid}.json`;
      textPath = `tmp/${uuid}.txt`;
      fs.writeFileSync(tempFilePath, pdfFile);
    } else {
      jsonPath = [...pdfFile.split(".").slice(0, -1), "json"].join(".")
      textPath = [...pdfFile.split(".").slice(0, -1), "txt"].join(".")
      tempFilePath = pdfFile;
    }
    // await this.PdfToTextSmart(tempFilePath)
    return new Promise((resolve, reject) => {
      pdfUtil.pdfToText(tempFilePath, function (err: any, data: string) {
        // fs.writeFileSync(textPath, data);
        if (pdfFile instanceof Buffer)
          fs.unlink(tempFilePath, () => { })
        if (err) reject(err);
        resolve(fixFrenchDiacritics(data)); //print all text    
      });

    })
  }
  static async PdfToTextSmart(pdfFile: Buffer | string): Promise<string> {
    let tempFilePath = "";
    let jsonPath: string
    let textPath: string
    if (pdfFile instanceof Buffer) {
      let uuid = randomUUID()
      tempFilePath = `tmp/${uuid}.pdf`;
      jsonPath = `tmp/${uuid}.smart.json`;
      textPath = `tmp/${uuid}.smart.txt`;
      fs.writeFileSync(tempFilePath, pdfFile);
    } else {
      jsonPath = [...pdfFile.split(".").slice(0, -1), "smart.json"].join(".")
      textPath = [...pdfFile.split(".").slice(0, -1), "smart.txt"].join(".")
      tempFilePath = pdfFile;
    }

    return new Promise(async (resolve, reject) => {
      try {
        const dataBuffer = fs.readFileSync(tempFilePath);
        const data = await pdfParse(dataBuffer);
        fs.writeFileSync(jsonPath, JSON.stringify(data));
        fs.writeFileSync(textPath, data.text);


        // Now 'data' contains information about the PDF, including text and layout.

        // You may want to process 'data.text' or 'data.pages' to extract tables.

        if (pdfFile instanceof Buffer) {
          fs.unlink(tempFilePath, () => { });
        }

        resolve(fixFrenchDiacritics(data.text));
      } catch (err) {
        reject(err);
      }
    });
  }
  static async PdfToPngFile(buffer: Buffer) {
    const buffers = await pdfToPng(buffer, {
      pagesToProcess: [1]
    })
    return buffers[0].content
  }
  static GenerateHTMLTemplate(templatePath: string, savePath: string, data: any) {
    return new Promise(async (resolve, reject) => {
      try {
        for (const key in data) {
          data[key] = data[key] != undefined ? data[key] : ""
          data[key] = data[key] != null ? data[key] : ""
        }
        const html = await ejs.renderFile(templatePath, data) as string
        const result = htmlPdf.create(html, { format: "A4" })
        const dirname = Path.dirname(savePath)
        if (!fs.existsSync(dirname)) {
          fs.mkdirSync(dirname, { recursive: true });
        }
        result.toFile(savePath, function (err, res) {
          if (err) { return reject(err) }
          return resolve(res)
        });
      } catch (error) {
        reject(error)
      }
    })
  }

}