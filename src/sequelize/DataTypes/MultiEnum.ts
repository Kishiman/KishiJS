import { DataTypes, Dialect, Sequelize } from "sequelize";
import { KishiDataType, KishiModel } from "../";
import { KArray } from "../../utils/array";

export class MultiEnum extends DataTypes.ENUM implements KishiDataType {
  ts_typeStr: string = ``;
  key = "Enum";
  dialect: Dialect = "mysql";
  dialectTypes = "mysql";
  modelName: string = "";
  attributeName: string = "";
  multiValues: string[] = [];
  multiValuesSetsStr: string[] = [];
  getters?: ((value: any) => any)[] = [];
  setters?: ((value: any) => any)[] = [];
  constructor(...multiValues: string[]) {
    super()
    this.getters?.push((value: any) => {
      if (!value) return value
      return JSON.parse(value);
    })
    this.setters?.push((value: any) => {
      if (!value) return value
      value = Array.isArray(value) ? value : [value]
      const intersection = KArray.intersection(multiValues, value).sort()
      return JSON.stringify(intersection);
    })
    this.multiValues = [...new Set(multiValues.sort())];
    this.ts_typeStr = this.multiValues.map(value => `'${value}'`).join(" | ")
    this.ts_typeStr = `(${this.ts_typeStr})[]`
    console.log(this.ts_typeStr);
    const multiValuesSets = KArray.allSubSets(this.multiValues)
    this.multiValuesSetsStr = []
    for (const set of multiValuesSets)
      this.multiValuesSetsStr.push(JSON.stringify(set));
    const superType = DataTypes.ENUM(...this.multiValuesSetsStr);
    (this as any).values = superType.values;
    (this as any).options = superType.options;
    this.key = superType.key
    console.warn("MultiEnum", this.multiValuesSetsStr.length);
    return this;
  }

  get defaultValue() {
    const defaultValue = null as any;
    return defaultValue;
  }
}

(Sequelize as any).MultiEnum = MultiEnum;