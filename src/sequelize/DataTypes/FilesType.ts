import { config } from "../../config";
import { Dialect, Sequelize } from "sequelize";
import { KishiDataType, KishiModel, KishiModelAttributeColumnOptions } from "../";
import fs from "fs"
import { KArray } from "../../utils/array";
import { AbstractFile, FileLib } from "../../utils/file";
import { randomUUID } from "crypto";
import Path from "path";
const { uploadPath, server: { publicUrl } } = config;


export class FilesType implements KishiDataType {
  ts_typeStr?: string = `{ key: string, url: string }[]`;
  isFile: boolean = true;
  isArray: boolean = true;
  key = "FilesType";
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
      const fileNames = JSON.parse(rawValue) as string[]
      return Array.from(fileNames, fileName => {
        return {
          key: fileName,
          url: `${publicUrl}/${modelName}_${attributeName}/${fileName}`,
        }
      })
    }
    attribute.set = function set(files: AbstractFile | AbstractFile[]) {
      if (!files) return
      const rawValue = this.getDataValue(attributeName)
      const fileNames = JSON.parse(rawValue || "[]") as string[]
      let _files: AbstractFile[] = Array.isArray(files) ? files : [files]
      for (const file of _files) {
        file.name = `${randomUUID()}-${file.name.replace(/[^a-zA-Z0-9-_\.]/g, '')}`
        if (file.name.length > length) {
          const ext = Path.extname(file.name)
          if (ext.length < (length - 38))
            file.name = file.name.slice(0, length - ext.length) + ext
          else
            file.name = file.name.slice(0, length)
        }
        fileNames.push(file.name)
      }
      if (this as KishiModel) {
        (this as KishiModel).setFile(attributeName, _files)
      }
      for (const file of _files)
        FileLib.mv(file, `${uploadPath}/${modelName}_${attributeName}/${file.name}`)
      this.setDataValue(attributeName, JSON.stringify(fileNames))
    }
  }
  Hook(Model: typeof KishiModel): void {
    const { modelName, attributeName, length } = this
    Model.afterCreate(async (instance, options) => {
      if (instance.get(attributeName) && instance.files[attributeName]) {
        const files = instance.files[attributeName] as AbstractFile[]
        //always delete from files Record after save to avoid resetting
        delete instance.files[attributeName]
      }
    })
    Model.afterUpdate(async (instance, options) => {
      if (options.fields?.includes(attributeName)) {
        delete instance.files[attributeName]
        const previousRaw = instance.previous(attributeName)
        if (previousRaw) {
          const previous = JSON.parse(previousRaw)
          const rawValue = instance.getDataValue(attributeName)
          const fileNames = JSON.parse(rawValue || "[]") as string[]
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
(Sequelize as any).FilesType = FilesType;
