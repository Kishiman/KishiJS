import { DataTypes, Sequelize } from "sequelize";
import { ModelHooks } from "sequelize/types/hooks";
import { UserEntity } from "../domain/entities";
import { typesOfKishiAssociationOptions, KishiModelAttributeColumnOptions, KOp, CrudOptions } from "../sequelize";
import { KishiModel, KishiModelAttributes, KishiDataTypes } from "../sequelize";
import { NotificationSource } from "../services/notification";
export class Notification extends KishiModel {
  static crudOptions: CrudOptions = {
    "create": false,
    "read": (user?: UserEntity) => { return user && { "$users.id$": user?.id } || false },
    "update": false,
    "delete": false,
  }
  static WhereFromDisplay(display: string) {
    return { message: { [KOp("iLike")]: `%${display}%` } }
  }
  get display() {
    return this.get("message") as string
  }
  static types = ["Custom", "Create", "Update"]
  static initialAttributes: KishiModelAttributes = {
    id: {
      type: KishiDataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    type: {
      type: KishiDataTypes.ENUM(...Notification.types),
      allowNull: false,
      update: false,
      defaultValue: "Custom",
    },
    message: {
      type: KishiDataTypes.STRING(200),
      update: false,
      defaultValue: "",
      allowNull: false,
    },
    ressourceName: {
      type: KishiDataTypes.STRING(40),
      update: false,
      defaultValue: "",
    },
    ressourceId: {
      type: KishiDataTypes.STRING(20),
      update: false,
    },
    triggeredBy: {
      type: KishiDataTypes.STRING(20),
      update: false,
    },
  };
  static initialAssociations: { [key: string]: typesOfKishiAssociationOptions } = {
    users: {
      type: "belongsToMany",
      target: "User",
      schemaMap: {
        "nested": "pure",
        "full": "pure",
      },
      through: "Notification_User",
    },
  };
  static PreInit(sequelize: Sequelize, models: Record<string, typeof KishiModel>): void {
    let ressources: string[] = [""]
    for (const modelname in models) {
      if ((models[modelname] as any as NotificationSource)?.notificationOptions) {
        ressources.push(modelname)
      }
    }
    (this.initialAttributes["ressourceName"] as KishiModelAttributeColumnOptions).type = DataTypes.ENUM(...ressources)
  }
}

export class Notification_User extends KishiModel {
  static crudOptions: CrudOptions = {
    "create": false,
    "read": false,
    "update": false,
    "delete": false,
  }
  static initialAttributes: KishiModelAttributes = {
    id: {
      type: KishiDataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    seenDate: {
      type: KishiDataTypes.DATE,
    },
  };
  static initialHooks: Partial<ModelHooks<KishiModel, any>> = {
    afterSync: async (options) => {
    }
  }
}
