import { config } from "../../config";
import { Dialect, Sequelize } from "sequelize";
import { KishiDataType, KishiModel, KishiModelAttributeColumnOptions } from "..";
import fs from "fs"
import { KArray } from "../../utils/array";
import { AbstractFile, FileLib } from "../../utils/file";
import { randomUUID } from "crypto";
import Path from "path";
const { uploadPath, server: { publicUrl } } = config;


export class NamedFilesType implements KishiDataType {
  ts_typeStr?: string = `{ key: string, fileName:string, url: string }[]`;
  isFile: boolean = true;
  isArray: boolean = true;
  key = "NamedFilesType";
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
    const { modelName, attributeName, length } = this
    //create directory
    fs.mkdirSync(`${uploadPath}/${modelName}_${attributeName}`, { recursive: true })
    attribute.fromView = false
    attribute.get = function get() {
      const rawValue = this.getDataValue(attributeName)
      if (rawValue === undefined) return rawValue
      if (!rawValue) return []
      const fileItems = JSON.parse(rawValue) as [string, string][]
      return Array.from(fileItems, ([key, fileName]) => {
        return {
          key,
          fileName,
          url: `${publicUrl}/${modelName}_${attributeName}/${key}`,
        }
      })
    }
    attribute.set = function set(files: AbstractFile | AbstractFile[]) {
      if (!files) return
      const rawValue = this.getDataValue(attributeName)
      const fileItems = JSON.parse(rawValue || "[]") as [string, string][]
      let _files: AbstractFile[] = Array.isArray(files) ? files : [files]
      for (const file of _files) {
        const fileName = file.name
        const ext = file.name.split(".").pop()
        file.name = `${randomUUID()}.${ext}`
        const key = file.name
        fileItems.push([key, fileName])
      }
      if (this instanceof KishiModel) {
        (this as KishiModel).setFile(attributeName, _files)
      }
      for (const file of _files)
        FileLib.mv(file, `${uploadPath}/${modelName}_${attributeName}/${file.name}`)
      this.setDataValue(attributeName, JSON.stringify(fileItems))
    }
  }
  Hook(Model: typeof KishiModel): void {
    const { modelName, attributeName, length } = this
    Model.afterCreate(async (instance, options) => {
      if (instance.get(attributeName) && instance.files[attributeName]) {
        delete instance.files[attributeName]
      }
    })
    Model.afterUpdate(async (instance, options) => {
      if (options.fields?.includes(attributeName)) {
        delete instance.files[attributeName]
        const previousRaw = instance.previous(attributeName)
        if (previousRaw) {
          const previous = KArray.get(JSON.parse(previousRaw), 0)
          const rawValue = instance.getDataValue(attributeName)
          const fileNames = KArray.get(JSON.parse(rawValue || "[]") as string[], 0)
          let diff = KArray.minus(previous, fileNames)
          for (const toDelete of diff) {
            fs.unlinkSync(`${uploadPath}/${modelName}_${attributeName}/${toDelete}`)
          }
        }
      }
    })
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
  _sanitize = (value: any): any => {
    if (!value) return value;
    return typeof value == "string" ? value : JSON.stringify(value);
  };
  get defaultValue() {
    return [] as any;
  }
}
(Sequelize as any).NamedFilesType = NamedFilesType;
