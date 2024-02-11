import { Dialect, literal, Sequelize } from "sequelize";
import { Literal } from "sequelize/types/utils";
import { KishiDataType } from "../";


export class Point implements KishiDataType {
  ts_typeStr?: string = `[number,number]`;
  key = "Point";
  dialect: Dialect = "mysql";
  dialectTypes = "mysql";
  modelName: string = "";
  attributeName: string = "";
  getters?: ((value: any) => any)[] = [];
  setters?: ((value: any) => any)[] = [];
  constructor() {
    this.getters?.push((value: any) => {
      if (!value) return value
      const str = ((value as Literal).val as string).slice("point".length)
      let [val1, val2] = str.slice(1, str.length - 1).split(",")
      return [Number(val1), Number(val2)]
    })
    this.setters?.push((value: any) => {
      if (!value) return value
      return literal(`point(${value[0]},${value[1]})`)
    })
    return this;
  }
  public toString() {
    return "POINT";
  }
  public toSql(): string {
    return "POINT";
  }
  stringify = (value: any): string => {
    return value
  };
  _sanitize = (value: any, options: any): any => {
    if (!value) return value;
    // console.log("point__sanitize", value);
    if ((value as Literal).val) return value
    if (value.coordinates)
      return literal(`point(${value.coordinates[0]},${value.coordinates[1]})`)
    //postgres
    if ("x" in value && "y" in value) return literal(`point(${value.x},${value.y})`)
    return literal(`point(${value[0]},${value[1]})`)
  };


  get defaultValue() {
    const defaultValue = null as any;
    return defaultValue;
  }
}

(Sequelize as any).Point = Point;