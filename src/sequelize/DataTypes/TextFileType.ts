import { config } from "../../config";
import { Dialect, Sequelize } from "sequelize";
import { KishiDataType, KishiModel, KishiModelAttributeColumnOptions } from "..";
import fs from "fs"
import { randomUUID } from "crypto";
const { uploadPath, server: { publicUrl } } = config;

export class FileText implements KishiDataType {
  ts_typeStr?: string = `string`;
  key = "FileText";
  dialect: Dialect = "mysql";
  dialectTypes = "mysql";
  modelName: string = "";
  attributeName: string = "";
  getters?: ((value: any) => any)[] = [];
  setters?: ((value: any) => any)[] = [];
  length: number = 40;
  constructor() {
    return this;
  }
  Init(Model: typeof KishiModel, attribute: KishiModelAttributeColumnOptions): void {
    const { modelName, attributeName } = this
    //create directory
    fs.mkdirSync(`${uploadPath}/${modelName}_${attributeName}`, { recursive: true })
    attribute.fromView = ((value: { key: string, url: string }) => value?.url) as any
    attribute.get = function get() {
      const dataValue = this.getDataValue(attributeName) as string
      if (!dataValue) return dataValue
      return `${publicUrl}/${modelName}_${attributeName}/${dataValue}`
    }
    attribute.set = function set(text: string) {
      if (!text) return
      let fileName = `${randomUUID()}.txt`
      this.setDataValue(attributeName, fileName)
      fs.writeFile(`${uploadPath}/${modelName}_${attributeName}/${fileName}`, text, () => { })
    }
  }
  Hook(Model: typeof KishiModel): void {
    const { modelName, attributeName, length } = this
    Model.afterUpdate(async (instance, options) => {
      if (options.fields?.includes(attributeName)) {
        const previous = instance.previous(attributeName)
        if (previous) {
          fs.unlinkSync(`${uploadPath}/${modelName}_${attributeName}/${previous}`)
        }
      }
    })
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
(Sequelize as any).FileText = FileText;
