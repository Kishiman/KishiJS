import { Dialect, Sequelize } from "sequelize";
import { KishiDataType } from "../";
export class JSONType implements KishiDataType {
  ts_typeStr?: string = `any`;
  x: object = {};
  key = "JSONType";
  dialect: Dialect = "mysql";
  dialectTypes = "mysql";
  modelName: string = "";
  attributeName: string = "";
  getters?: ((value: any) => any)[] = [];
  setters?: ((value: any) => any)[] = [];
  constructor() {
    this.getters?.push((value: any) => {
      if (!value) return value
      return JSON.parse(value);
    })
    this.setters?.push((value: any) => {
      if (!value) return value
      return JSON.stringify(value);
    })
    return this;
  }
  public toString() {
    return "TEXT";
  }
  public toSql(): string {
    return "TEXT";
  }

  stringify = (value: any): string => {
    return value;
  };
  get defaultValue() {
    const defaultValue = {} as any;
    return defaultValue;
  }
}

// Mandatory: set the type key
// JSONType.prototype.key = "JSONType";
// JSONType.prototype

// Mandatory: add the new type to DataTypes. Optionally wrap it on `Utils.classToInvokable` to
// be able to use this datatype directly without having to call `new` on it.
(Sequelize as any).JSONType = JSONType;

// Optional: disable escaping after stringifier. Do this at your own risk, since this opens opportunity for SQL injections.
// DataTypes.SOMETYPE.escape = false;
