const pdfUtil = require('pdf-to-text')
import fs from "fs";

import { randomUUID } from 'crypto';
import { fixFrenchDiacritics } from "../utils/string";


export class PDFToTextLib {
  static async PdfToText(pdfFile: Buffer | string): Promise<string> {
    let tempFilePath = ""
    if (pdfFile instanceof Buffer) {
      tempFilePath = `tmp/${randomUUID()}.pdf`
      fs.writeFileSync(tempFilePath, pdfFile)
    } else
      tempFilePath = pdfFile
    return new Promise((resolve, reject) => {
      pdfUtil.pdfToText(tempFilePath, function (err: any, data: string) {
        if (pdfFile instanceof Buffer)
          fs.unlink(tempFilePath, () => { })
        if (err) reject(err);
        resolve(fixFrenchDiacritics(data)); //print all text    
      });

    })
  }
}