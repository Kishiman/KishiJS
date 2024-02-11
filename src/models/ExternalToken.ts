import { Sequelize } from "sequelize/types";
import { KishiModel, KishiModelAttributes, KishiDataTypes, typesOfKishiAssociationOptions, CrudOptions, KishiModelOptions, KishiModelAttributeColumnOptions } from "../sequelize";
export class ExternalToken extends KishiModel {
  static crudOptions: CrudOptions = {
    "create": false,
    "read": false,
    "update": false,
    "delete": false,
  }
  static TokenTypes = ["Google", "LinkedIn"]
  static initialAttributes: KishiModelAttributes = {
    id: {
      type: KishiDataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    UserType: {
      type: KishiDataTypes.STRING(40),
      allowNull: false,
    },
    token: {
      type: KishiDataTypes.STRING(256),
      allowNull: false,
    },
    ip: {
      type: KishiDataTypes.STRING(16),
    },
    expiresAt: {
      type: KishiDataTypes.DATE(),
    },
    type: KishiDataTypes.ENUM(...this.TokenTypes),

  };
  static initialAssociations: { [key: string]: typesOfKishiAssociationOptions } = {
    user: {
      type: "belongsTo",
      target: "User",
      foreignKey: "userId",
    },
  };
  static initialOptions: KishiModelOptions = {
    indexes: [{
      name: "token",
      unique: true,
      fields: ["token"]
    }],
  }
  static PreInit(sequelize: Sequelize, models: Record<string, typeof KishiModel>): void {
    let UserTypes: string[] = []
    for (const modelname in models) {
      if (models[modelname].ParentModel == models.User) {
        UserTypes.push(modelname)
      }
    }
    (this.initialAttributes["UserType"] as KishiModelAttributeColumnOptions).type = KishiDataTypes.ENUM(...UserTypes)
  }
}
