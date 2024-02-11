import { config } from "./config";

import express from "express";
import cors from "cors";
import fileUpload from "express-fileupload";
import bodyParser from "body-parser";
import morgan from "morgan";
import fs from "fs";

import { apiLogHandler } from "./routers/Handlers/apiLog";
import { ModelRouter } from "./routers/Model"

import { sequelize, models } from "./models";

import { NotificationService } from "./services/notification";
import { QueryCacheService } from "./services/queryCache";
import { UserAuthService } from "./services/userAuth";
import { MailService } from "./services/mail";
import swaggerUi from "swagger-ui-express";
const swaggerModels = require("../docs/swagger-models.json")
import { DataBinder } from "./services/DataBinder";
import { UtilsRouter } from "./routers/Utils";


const { uploadPath } = config;

export let router = express.Router();
export let app = express().use(router);
export const dbSync = sequelize.sync()
if (!fs.existsSync("tmp")) { fs.mkdirSync("tmp"); }
if (!fs.existsSync("logs")) { fs.mkdirSync("logs"); }
if (!fs.existsSync(uploadPath)) { fs.mkdirSync(uploadPath); }

dbSync.then(async sequelize => {
  for (const modelName in models) {
    try {
      console.log(`${modelName}.AfterSync`);
      const prom = models[modelName].AfterSync?.(sequelize)
      if (prom)
        await prom
    } catch (error) {
      console.error(error);
    }
  }
  return sequelize
}).then(async sequelize => {
  try {
    await DataBinder.Init(models)
  } catch (error) {
    console.error(error);
  } finally {
    return sequelize
  }
})
router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerModels));
router.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    return callback(null, true);
  },
}));
router.use(morgan("dev"));
router.use(morgan("dev", { immediate: true }));

router.use(bodyParser.json({ limit: "50mb" }));
router.use(bodyParser.urlencoded({
  parameterLimit: 100000,
  limit: "50mb",
  extended: true,
}));

router.use(express.static("assets"));
router.use(express.static("logs"));
router.use(express.static("public"));
router.use(express.static(uploadPath));
router.use(fileUpload({ createParentPath: true }));

router.use(apiLogHandler)


router.use("/utils", UtilsRouter.Route())

for (const name in models) {
  const modelRouter = new ModelRouter(models[name])
  router.use(`/${name}`, modelRouter.Route())
}


NotificationService.Init(models, router)
MailService.Init(models, router)
// QueryCacheService.Init(models, router)
UserAuthService.Init(models, router)
