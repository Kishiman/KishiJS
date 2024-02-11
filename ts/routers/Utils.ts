import { Router, text } from "express";

import bodyParser from "body-parser";
import _ from "lodash";
import { ObjectToXML } from "../utils/object";
import fs from "fs"
import { randomUUID } from "crypto";
import { config } from "../config";
import DocxLib from "../utils/docx";
const { uploadPath, server: { publicUrl } } = config;
export let router = Router();

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

export class UtilsRouter {
  static Route(): Router {
    let router: Router = Router();
    router.use(text({ limit: '10mb' })); // Adjust the limit as needed
    router.post('/jsonToXML', async function (req, res, next) {
      res.status(200).contentType("xml").send(ObjectToXML(req.body))
    });

    router.post('/htmlToDocx', bodyParser.text(), async function (req, res, next) {
      const htmlContent = req.body;
      const fileName = req.query.fileName || "docx";
      const docxBuffer = await DocxLib.HtmlToDocx(htmlContent)
      const uuid = randomUUID()
      fs.mkdirSync(`${uploadPath}/${uuid}`, { recursive: true })
      fs.writeFileSync(`${uploadPath}/${uuid}/${fileName}.docx`, docxBuffer)
      setTimeout(() => {
        fs.rmSync(`${uploadPath}/${uuid}/${fileName}.docx`)
        fs.rmdirSync(`${uploadPath}/${uuid}`)
      }, 2 * 60 * 1000)
      res.status(200).send({
        key: fileName,
        url: `${publicUrl}/${uuid}/${fileName}.docx`,
      })
    });
    return router;
  }
}
