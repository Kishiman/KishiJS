import { Sequelize } from "sequelize/types";
import { ModelHooks } from "sequelize/types/hooks";
import { UserEntity } from "../domain/entities";
import { KishiModel, KishiModelAttributes, KishiDataTypes, KOp, typesOfKishiAssociationOptions, CrudOptions } from "../sequelize";
export class Event extends KishiModel {
  static crudOptions: CrudOptions = {
    "create": true,
    "read": (user?: UserEntity) => { return user && { "$users.id$": user?.id } || false },
    "update": (user?: UserEntity) => { return user && { "$users.id$": user?.id } || false },
    "delete": (user?: UserEntity) => { return user && { "$users.id$": user?.id } || false },
  }
  static eventTypes = ["Custom"]
  static WhereFromDisplay(display: string) {
    return { title: { [KOp("iLike")]: `%${display}%` } }
  }
  get display() {
    return this.get("title") as string
  }
  static initialAttributes: KishiModelAttributes = {
    id: {
      type: KishiDataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: KishiDataTypes.STRING,
      allowNull: false,
    },
    flag: {
      type: KishiDataTypes.ENUM(...this.eventTypes),
    },
    startDate: {
      type: KishiDataTypes.DATE,
    },
    endDate: {
      type: KishiDataTypes.DATE,
    },
    allDay: {
      type: KishiDataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    description: {
      type: KishiDataTypes.TEXT,
    },
  };
  static initialAssociations: { [key: string]: typesOfKishiAssociationOptions } = {
    users: {
      type: "belongsToMany",
      target: "User",
      schemaMap: {
        "nested": "nested",
        "full": "nested",
      },
      through: "Event_User",
    },
  };
  static PreInit(sequelize: Sequelize, models: Record<string, typeof KishiModel>): void {
  }
}
export class Event_User extends KishiModel {
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
  };
  static initialHooks: Partial<ModelHooks<KishiModel, any>> = {
    afterSync: async (options) => {
    }
  }
}
