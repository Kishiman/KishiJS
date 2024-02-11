import { config } from "./../config";

import { Op, Sequelize } from "sequelize";

import { KishiModel } from "../sequelize";
import { forKey } from "../utils/object";
import { FileLogger } from "../utils/fileLogger";

const {
  db: { name, user, password, host, port, dialect, paranoid },
} = config;
const logger = new FileLogger("sequelize")

let operatorsAliases: any = {};
forKey(Op, (key, value) => {
  operatorsAliases["#" + key] = value;
});
export const sequelize = new Sequelize(name, user, password, {
  host,
  port,
  dialect,
  operatorsAliases,
  logging: (sql: string, queryObject: any) => {
    logger.log(sql)
  },
  define: { paranoid, freezeTableName: true },
  pool: { max: 5, min: 0, acquire: 30000, idle: 10000 },
});

//Initilize models

import { ExternalToken } from "./ExternalToken";
import { User } from "./User";
import { Admin } from "./users";
import { Client } from "./users";
import { Notification, Notification_User } from "./Notification";
import { Event, Event_User } from "./Event";
import { OpenAIResponseLog } from "./OpenAIResponseLog";


export const models: {
  [name: string]: typeof KishiModel;
} = {
  ExternalToken,
  User,
  Admin,
  Client,
  Notification, Notification_User,
  Event, Event_User,
  OpenAIResponseLog,
};

for (const name in models) {
  models[name].Init(sequelize, models)
}

//Associate models
for (const modelName in models) {
  let Model = models[modelName];
  Model.Associate()
}
for (const modelName in models) {
  let Model = models[modelName];
  Model.PostAssociate()
}

export default {
  sequelize,
  ...models,
};
