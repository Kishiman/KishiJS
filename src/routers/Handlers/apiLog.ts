
import express from "express";
import { FileLogger } from "../../utils/fileLogger";
let apiRegister: { req: express.Request; date: Date }[] = [];
const logger = new FileLogger("apiRegister")

export const apiLogHandler: express.RequestHandler = function (req, res, next) {
  const now = new Date();
  let msg = `${now.toISOString()}-->${req.originalUrl}`;
  if (apiRegister.length > 0) {
    msg += "\n";
    for (const item of apiRegister) {
      msg += "[" + item.req.originalUrl + ":" + (now.getTime() - item.date.getTime()) + "]\t";
    }
  }
  apiRegister.push({ req, date: now });
  logger.log(msg)

  res.on("finish", function () {
    const now = new Date();
    const item = apiRegister.find((item) => item.req == req);
    if (!item) return;
    let msg = req.originalUrl + ":" + (now.getTime() - item.date.getTime()) + "\t:" + req.res?.json.length;
    apiRegister = apiRegister.filter((item) => item.req != req);
    if (apiRegister.length > 0) {
      msg += "\n";
      for (const item of apiRegister) {
        msg += "[" + item.req.originalUrl + ":" + (now.getTime() - item.date.getTime()) + "]\t";
      }
    }
    logger.log(msg)
  });
  next();
}