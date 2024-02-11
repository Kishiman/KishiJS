import { Router } from "express";
import { Sequelize,Model, ModelAttributeColumnOptions,DataTypes, Transaction } from "sequelize";
import { KishiModel } from "../sequelize";
import { FileLogger } from "../utils/fileLogger";

require('dotenv').config();
const StringLib = require('./string')
const fs = require('fs');
const db = require("../models");
const ArrayLib = require('./array');
const { cloneDeep } = require('lodash');

const { dbHistoryConfig } = require('../config')[process.env.CONFIG]; // get config file
const filepath = process.env.UPLOAD_PATH + "/HistorySequelize.log"
fs.writeFile(filepath, '', function () { console.log('done') })

const dbHistoryOptions = {
  ...dbHistoryConfig,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};
const historySequelize = new Sequelize.Sequelize(dbHistoryOptions.DB, dbHistoryOptions.USER, dbHistoryOptions.PASSWORD, {
  host: dbHistoryOptions.HOST,
  dialect: dbHistoryOptions.dialect,
  port: dbHistoryOptions.PORT,
  logging: (sql:string, queryObject:any) => {
    fs.appendFile(filepath, new Date(Date.now()).toISOString() + ":" + sql + "\n", () => { });
  },
  operatorsAliases: 0,
  define: {
    freezeTableName: true,
  },
  pool: dbHistoryOptions.pool,
});
var dbHistory: { [key in string]: typeof Model } = {}
dbHistory.sequelize = historySequelize;

const { sequelize, ...models } = db

// for (const key in models) {
//   /**@type  typeof Model */
//   let model = models[key]






//   // model.afterCreate(modelHistoryName, (row, options) => {
//   model.afterCreate(modelHistoryName + "_afterCreate", (row, options) => {
//     var data = cloneDeep(row["dataValues"])
//     const { authUser } = options
//     data["_model_id"] = data["id"]
//     delete data["id"]
//     if (authUser)
//       data["updatedBy_id"] = authUser.id
//     ModelHistory.create(data, {}).catch(err => {
//       console.error(new Error().stack);
//       console.error(err);
//     })
//   })
//   model.afterBulkCreate(modelHistoryName + "_afterBulkCreate", (rows, options) => {
//     var data = cloneDeep(ArrayLib.Array_key(rows, "dataValues"))
//     const { authUser } = options
//     for (var _data of data) {
//       if (!_data["id"])
//         continue
//       _data["_model_id"] = _data["id"]
//       delete _data["id"]
//       if (authUser)
//         _data["updatedBy_id"] = authUser.id
//     }
//     ModelHistory.bulkCreate(data, {}).catch(err => {
//       console.error(new Error().stack);
//       console.error(err);
//     })
//   })
//   model.afterUpdate(modelHistoryName + "_afterUpdate", (row, options) => {
//     var data = {}
//     const { authUser, fields } = options
//     console.log(fields);
//     for (const field of fields) {
//       if (field in rawAttributes)
//         data[field] = cloneDeep(row["dataValues"][field])
//     }
//     delete data["updatedAt"]
//     delete data["id"]
//     console.log(data);
//     if (Object.keys(data).length == 0)
//       return
//     data["_model_id"] = row["id"]
//     data["_nullFields"] = []
//     for (const key of nullable_attributes) {
//       if (key in data && data[key] == null)
//         data["_nullFields"].push(key)
//     }
//     if (authUser)
//       data["updatedBy_id"] = authUser.id
//     ModelHistory.create(data, {}).catch(err => {
//       console.error(new Error().stack);
//       console.error(err);
//     })
//   })
//   model.beforeBulkUpdate(modelHistoryName + "_beforeBulkUpdate", async (options) => {
//     await ModelLib.LoadOptionsRows(model, options)
//   })
//   model.afterBulkUpdate(modelHistoryName + "_afterBulkUpdate", async (options) => {
//     const { attributes, authUser, fields } = options
//     console.log(modelHistoryName + "_afterBulkUpdate");
//     console.log(fields);
//     if (options.hooks == false) {
//       console.log(new Error().stack);
//       return
//     }
//     const rows = ArrayLib.Array_key(options.rows, "dataValues")
//     if (rows && rows.length > 0) {
//       let data = {}
//       for (const field of fields) {
//         if (field in rawAttributes)
//           data[field] = cloneDeep(attributes[field])
//       }
//       delete data["updatedAt"]
//       console.log(data);
//       if (Object.keys(data).length == 0)
//         return
//       data["_nullFields"] = []
//       for (const key of nullable_attributes) {
//         if (key in data && data[key] == null)
//           data["_nullFields"].push(key)
//       }
//       if (authUser)
//         data["updatedBy_id"] = authUser.id
//       var bulkData = []
//       for (const row of rows) {
//         bulkData.push({
//           ...data,
//           _model_id: row["id"]
//         })
//       }
//       ModelHistory.bulkCreate(bulkData, {}).catch(err => {
//         console.error(new Error().stack); console.error(err);

//       })
//     }
//   })


//   const modelDeleteName = name + "Delete"

//   class ModelDelete extends Model { }
//   ModelDelete.init({
//     "id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
//     "_model_id": { type: model_id_type, allowNull: false },
//     "deletedBy_id": { type: user_id_type }
//   }, { sequelize: historySequelize, name: modelDeleteName, modelName: modelDeleteName, createdAt: false })
//   dbHistory[modelDeleteName] = ModelDelete

//   model.afterDestroy(modelDeleteName + "_afterDestroy", (row, options) => {
//     const { authUser } = options
//     if (!row)
//       return
//     ModelDelete.create({
//       "_model_id": row.id,
//       "deletedBy_id": authUser ? authUser.id : null,
//     }).catch(err => {
//       console.error(new Error().stack);
//       console.error(err);
//     })
//   })
//   model.beforeBulkDestroy(modelDeleteName + "_beforeBulkDestroy", async (options) => {
//     await ModelLib.LoadOptionsRows(model, options)
//   })

//   model.afterBulkDestroy(modelDeleteName + "_afterBulkDestroy", async (options) => {
//     const { authUser } = options
//     if (options.hooks == false) {
//       console.log(modelDeleteName + "_afterBulkDestroy");
//       console.log(options.where, options.rows.length, options.hooks);
//       console.log(new Error().stack);
//       return
//     }
//     const rows = ArrayLib.Array_key(options.rows, "dataValues")
//     if (rows && rows.length > 0) {
//       var data = []
//       for (const row of rows) {
//         data.push({
//           "_model_id": row.id,
//           "deletedBy_id": authUser ? authUser.id : null,
//         })
//       }
//       ModelDelete.bulkCreate(data, {}).catch(err => {
//         console.error(new Error().stack);
//         console.error(err);
//       })
//     }
//   })
// }
const logger = new FileLogger("dbBackup")

export class QueryCacheService {
  static Init(models: { [name: string]: typeof KishiModel }, router: Router) {
    const { User } = models
    const user_id_type = User.getAttributes()["id"].type
    for (const modelName in models) {
      const model = (models[modelName]);
      const model_id_type = model.rawAttributes["id"].type

      const { name } = model
      const originalAttributes = model.getAttributes()
      var attributes: {
        [attribute: string]: ModelAttributeColumnOptions<Model<any, any>>;
      } = {}
      for (const name in originalAttributes) {
        const { type } = originalAttributes[name]
        attributes[name] = { type }
      }
      delete attributes["id"]
      delete attributes["createdBy_id"]
      delete attributes["updatedBy_id"]
      delete attributes["deletedBy_id"]
      delete attributes["createdAt"]
      delete attributes["updatedAt"]
      delete attributes["deletedAt"]
      const modelHistoryName = name + "History"
      var nullable_attributes = []
      console.log(model.name);
      for (const name in attributes) {
        const { type, allowNull } = originalAttributes[name]
        if (type.constructor.name == "VIRTUAL")
          continue
        if (allowNull == false) {
          console.warn(`ignore ${model.name}.${name}`);
          continue
        }
        // if (noUpdate == true) {
        //     console.warn(`ignore ${model.name}.${name}`);
        //     continue
        // }
        nullable_attributes.push(name)
      }
      nullable_attributes = nullable_attributes.sort((a: any, b: any) => b - a)
      // console.log(nullable_attributes);
      const nullable_attributes_subSets = ArrayLib.allSubSets(nullable_attributes)
      let _nullFields_enum = []
      for (const subSet of nullable_attributes_subSets) {
        _nullFields_enum.push(JSON.stringify(subSet))
      }
      console.log(_nullFields_enum);

      class ModelHistory extends Model { }

      ModelHistory.init({
        "id": { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        ...attributes,
        "_model_id": { type: model_id_type, allowNull: false, },
        "_nullFields": {
          type: DataTypes.ENUM(..._nullFields_enum), defaultValue: JSON.stringify([]),
          get() { try { return JSON.parse((this as any).getDataValue("_nullFields")) } catch (err) { console.error(err); return [] } },
          set(value: string[]) { (this as any).setDataValue("_nullFields", JSON.stringify(value)) },
        },
        "updatedBy_id": { type: user_id_type },
      }, { sequelize: historySequelize, name: modelHistoryName, modelName: modelHistoryName, createdAt: false })
      dbHistory[modelHistoryName] = ModelHistory
      model.afterCreate((row, options) => {
        logger.warn(model.name, "afterCreate");
      })
      model.afterUpdate((row, options) => {
        logger.warn(model.name, "afterUpdate");
      })
      model.afterDestroy((row, options) => {
        logger.warn(model.name, "afterDestroy");
      })
      model.afterBulkCreate((rows, options) => {
        logger.warn(model.name, "afterBulkCreate");
      })
      model.afterBulkUpdate((options) => {
        logger.warn(model.name, "afterBulkUpdate");
      })
      model.afterBulkDestroy((options) => {
        logger.warn(model.name, "afterBulkDestroy");
      })
    }
  }
}