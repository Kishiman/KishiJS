import { ModelHooks } from "sequelize/types/hooks";
import { KishiModel, KishiModelAttributes, KishiDataTypes, KOp, typesOfKishiAssociationOptions, CrudOptions } from "../sequelize";

export class User extends KishiModel {
  static crudOptions: CrudOptions = {
    "create": false,
    "read": (user) => { return user ? true || { id: user?.id } : false },
    "update": (user) => { return user ? { id: user?.id } : false },
    "delete": false,
  }

  static WhereFromDisplay(display: string) {
    const parts = display.split(" ")
    return {
      [KOp("or")]: {
        firstName: { [KOp("or")]: parts.map(value => { return { [KOp("iLike")]: `%${value}%` } }) },
        lastName: { [KOp("or")]: parts.map(value => { return { [KOp("iLike")]: `%${value}%` } }) },
      }
    }
  }
  get display() {
    return this.get("fullName") as string
  }
  static initialAttributes: KishiModelAttributes = {
    id: {
      type: KishiDataTypes.UUID,
      primaryKey: true,
      defaultValue: KishiDataTypes.UUIDV4,
    },
    activated: {
      type: KishiDataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      fromView: false,
    },
    passwordChangedDate: {
      type: KishiDataTypes.DATE,
      fromView: false,
    },
    logoutDate: {
      type: KishiDataTypes.DATE,
      fromView: false,
    },
    username: KishiDataTypes.STRING(50),
    email: {
      type: KishiDataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      update: true,
    },
    phoneNumber: new KishiDataTypes.PHONE(),
    firstName: KishiDataTypes.STRING(50),
    lastName: KishiDataTypes.STRING(50),
    dateOfBirth: KishiDataTypes.DATEONLY,
    placeOfBirth: KishiDataTypes.STRING(128),
    profilePhoto: new KishiDataTypes.FILE(128),
    password: {
      type: new KishiDataTypes.HASH(6),
      allowNull: false,
      toView: false,
      // fromView: false,
    },
    //virtuals
    fullName: {
      type: KishiDataTypes.VIRTUAL,
      fromView: false,
      ts_typeStr: "string",
      get() {
        const { firstName, lastName } = this as any;
        return firstName && lastName ? firstName + " " + lastName : null;
      },
    },
  };
  static initialAssociations: { [key: string]: typesOfKishiAssociationOptions } = {
    notifications: {
      type: "belongsToMany",
      target: "Notification",
      schemaMap: {
        "nested": null,
        "full": "nested",
      },
      through: "Notification_User",
    },
    // followers: {
    //   type: "belongsToMany",
    //   target: "User",
    //   schemaMap: {
    //     "nested": null,
    //     "full": "pure",
    //   },
    //   actionMap: {
    //     "Link": "Add",
    //   },
    //   foreignKey:"followerId",
    //   otherKey: "followerId",
    //   through: "UserFollow",
    // },
  };
  static initialHooks: Partial<ModelHooks<User, any>> = {
    afterSync: async (options) => {
    },
    beforeUpdate: (instance, options) => {
      if (options.fields?.includes("password")) {
        instance.set("passwordChangedDate", new Date())
        options.fields?.push("passwordChangedDate")
      }
    }
  }
}
export class UserUserFollow extends KishiModel {
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
}
