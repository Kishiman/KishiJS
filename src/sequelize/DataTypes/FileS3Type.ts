import { Dialect, Sequelize } from "sequelize";
import { KishiDataType, KishiModel, KishiModelAttributeColumnOptions } from "../";
import { AWSS3Service } from "../../services/awsS3";
import { AbstractFile } from "../../utils/file";
import { randomUUID } from "crypto";
import Path from "path";


export class FileS3Type implements KishiDataType {
  ts_typeStr?: string = `{ key: string, url: string }`;
  isFile?: boolean = true;
  key = "FileS3Type";
  dialect: Dialect = "mysql";
  dialectTypes = "mysql";
  modelName: string = "";
  attributeName: string = "";
  getters?: ((value: any) => any)[] = [];
  setters?: ((value: any) => any)[] = [];
  length: number = 64;
  constructor(length: number = 64) {
    if (length < 40)
      throw `File length shorter than 40`
    this.length = length
    return this;
  }
  Init(Model: typeof KishiModel, attribute: KishiModelAttributeColumnOptions): void {
    const { attributeName, length } = this
    attribute.fromView = false
    attribute.get = function get() {
      const dataValue = this.getDataValue(attributeName)
      if (!dataValue) return dataValue
      return {
        key: dataValue,
        url: AWSS3Service.urlPrefix + dataValue,
      }
    }
    attribute.set = function set(file: AbstractFile) {
      if (!file) return
      file.name = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9-_\.]/g, '')}`
      if (file.name.length > length) {
        const ext = Path.extname(file.name)
        if (ext.length < (length - 38))
          file.name = file.name.slice(0, length - ext.length) + ext
        else
          file.name = file.name.slice(0, length)
      }
      if (this as KishiModel) {
        (this as KishiModel).setFile(attributeName, file)
      }
    }
  }
  Hook(Model: typeof KishiModel): void {
    const { attributeName, length } = this
    Model.beforeCreate(async (instance, options) => {
      if (instance.files[attributeName]) {
        const file = instance.files[attributeName] as AbstractFile
        const result = await AWSS3Service.UploadFile([file], { ACL: "public-read" })
        instance.setDataValue(attributeName, result[0].Key)
        delete instance.files[attributeName]
      }
    })
    Model.beforeUpdate(async (instance, options) => {
      if (instance.files[attributeName]) {
        const file = instance.files[attributeName] as AbstractFile
        const result = await AWSS3Service.UploadFile([file], { ACL: "public-read" })
        instance.setDataValue(attributeName, result[0].Key)
        delete instance.files[attributeName]
      }
    })
    Model.afterUpdate(async (instance, options) => {
      if (options.fields?.includes(attributeName)) {
        const previous = instance.previous(attributeName)
        if (previous) {
          //delete previous file
          console.log(previous);
          await AWSS3Service.DeleteFile([previous])
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
(Sequelize as any).FileS3Type = FileS3Type;