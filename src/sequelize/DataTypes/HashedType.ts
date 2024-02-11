import { Dialect, Sequelize } from "sequelize";
import { KishiDataType, KishiModel } from "../";
import bcrypt from "bcryptjs";

export class HashedType implements KishiDataType {
  ts_typeStr?: string = `string`;
  key = "HashedType";
  dialect: Dialect = "mysql";
  dialectTypes = "mysql";
  modelName: string = "";
  attributeName: string = "";
  salt: number | string = 10;
  length: number = 64;
  getters?: ((value: any) => any)[] = [];
  setters?: ((value: any) => any)[] = [];
  compare(source: any, value: any): boolean {
    return bcrypt.compareSync(value, source)
  };

  constructor(salt: number | string = 10, length: number = 64) {
    this.salt = salt
    this.length = length
    this.setters?.push((value: string) => {
      if (!value) return value
      return bcrypt.hashSync(value, salt)
    })
    return this;
  }
  public toString() {
    return `VARCHAR(${this.length})`;
  }
  public toSql(): string {
    return `VARCHAR(${this.length})`;
  }

  stringify = (value: any): string => {
    return value
  };

  get defaultValue() {
    const defaultValue = null as any;
    return defaultValue;
  }
}

(Sequelize as any).HashedType = HashedType;