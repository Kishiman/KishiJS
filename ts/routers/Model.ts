
import { FindOptions, WhereAttributeHash } from "sequelize/types";
import { Router } from "express";
import bodyParser from "body-parser";
import _ from "lodash";

import { CrudOptions, KOp, KishiDataType, KishiModel } from "../sequelize";
import { flatToDeep, setDeepValue } from "../utils/object";
import { KArray } from "../utils/array";
import { Middleware, MiddlewareChain } from "../utils/middleware";
import { UserAuthService } from "../services/userAuth";
import { UserEntity } from "../domain/entities";
import { User } from "../models/User";
import { schemas } from "../domain/schemas";

export let router = Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

export class ModelRouter {
  Model: typeof KishiModel;
  constructor(Model: typeof KishiModel) {
    this.Model = Model
  }
  verifyUser: Middleware = async (req, res) => {
    const user = await UserAuthService.verifyToken(req).catch((err => null))
    req.middleData.user = user
    return user
  }
  verifyCrud = (crud: keyof CrudOptions): Middleware => {
    return async (req, res) => {
      const user: (User & UserEntity) | null = req.middleData.user
      const crudOption = this.Model.crudOptions[crud] || false
      let crudResponse
      if (typeof crudOption == "function") {
        crudResponse = await crudOption(user || undefined)
      } else {
        crudResponse = crudOption
      }
      if (!crudResponse)
        throw { status: 403, message: "User Not Authorized" };
      req.middleData.crudResponse = crudResponse
      return crudResponse
    }
  }
  parseFindOptions: Middleware = async (req, res) => {
    const crudResponse: true | WhereAttributeHash = req.middleData.crudResponse
    const schema: string = (req.query["schema"] || "pure") as string
    let findOptions: FindOptions = this.Model.SchemaToFindOptions(schema, true)
    if (schemas[this.Model.name]?.[schema]) {
      findOptions = this.Model.PathsToFindOptions(schemas[this.Model.name][schema])
    }
    const page: string = req.query["page"] as string;
    if (page) {
      const limit = Number(page.split(":")[0])
      let offset: number | undefined = limit * (Number(page.split(":")[1]) - 1)
      offset = offset != 0 ? offset : undefined
      findOptions.limit = limit
      findOptions.offset = offset
    } else {
    }
    const orderBy: string = req.query["orderBy"] as string
    if (orderBy) {
      const [name, order] = orderBy.split(":")
      findOptions.order = [[name, order]]
    } else {
      findOptions.order = [["id", "DESC"]]
    }
    const where = req.body?.where
    if (where) {
      const deepWhere = flatToDeep(where)
      let whereData = this.Model.FlattenWhere(deepWhere)
      findOptions.where = whereData
    }
    if (crudResponse != true) {
      findOptions.where = findOptions.where ? { [KOp("and")]: [findOptions.where, crudResponse] } : crudResponse
    }
    const group = req.query["group"] as string
    if (group) {
      findOptions.group = group
    }
    req.middleData.findOptions = findOptions
    return findOptions
  }
  parseReqData: Middleware = async (req, res) => {
    if (req.headers['content-type'] && req.headers['content-type'].includes('multipart/form-data')) {
      let data = {}
      for (const key in req.body) {
        setDeepValue(data, key, req.body[key])
        delete req.body[key]
      }
      req.body.data = data
    }
    let reqData = req.body.data
    if (req.body.isJSON)
      reqData = JSON.parse(reqData)
    if (req.files) {
      for (const key in req.files) {
        setDeepValue(reqData, key, req.files[key])
      }
    }
    req.middleData.reqData = reqData
    return reqData
  }
  findById: Middleware = async (req, res) => {
    const findOptions: FindOptions = req.middleData.findOptions
    const id: string = req.query["id"] as string
    delete findOptions.where
    const row = await this.Model.findByPk(id, findOptions)
    if (!row)
      throw { message: `Instance Not Found` }
    req.middleData.row = row
    return { row: row.toView() }
  }
  findAll: Middleware = async (req, res) => {
    const findOptions: FindOptions = req.middleData.findOptions
    const { rows, count } = await this.Model.findAndCountAll(findOptions)
    req.middleData.findAll = { rows, count }

    return { count, rows: this.Model.toView(rows) }
  }
  count: Middleware = async (req, res) => {
    const findOptions: FindOptions = req.middleData.findOptions
    const count = await this.Model.count(findOptions)
    return { count }
  }
  findOneWhere: Middleware = async (req, res) => {
    const findOptions: FindOptions = req.middleData.findOptions
    const row = await this.Model.findOne(findOptions)
    return { row: row?.toView() }
  }

  uploadFile: (attributeName: string) => Middleware = (attributeName: string) => {
    return async (req, res) => {
      const fileType = this.Model.rawAttributes[attributeName].type as KishiDataType
      if (!req.files?.["file"])
        throw {
          message: "File Not Found",
          attributeName,
        };
      if (Array.isArray(req.files["file"]) && !fileType.isArray)
        throw {
          message: "Found Multiple Files",
          length: (req.files["file"] as any[]).length
        };
      const id: string = req.query["id"] as string
      let row = await this.Model.findByPk(id)
      if (!row)
        throw { message: `Instance Not Found` }
      row.set(attributeName, req.files["file"])
      await row.save()
      return { row: row.toView() }
    }
  }
  deleteFile: (attributeName: string) => Middleware = (attributeName: string) => {
    return async (req, res) => {
      const fileType = this.Model.rawAttributes[attributeName].type as KishiDataType
      const id: string = req.query["id"] as string
      let row = await this.Model.findByPk(id)
      if (!row)
        throw { message: `Instance Not Found` }
      let toDelete = (req.body?.file || []) as any | any[]
      toDelete = Array.isArray(toDelete) ? toDelete : [toDelete]
      toDelete = KArray.toValues(toDelete, "key") as string[]
      let found = []
      let notFound = []

      let fileNames = fileType.isArray ? JSON.parse(row.getDataValue(attributeName) || "[]") : [row.getDataValue(attributeName)] as string[]
      found = KArray.intersection(fileNames, toDelete)
      notFound = KArray.minus(toDelete, found)
      const remainng = KArray.minus(fileNames, found)
      row.setDataValue(attributeName, fileType.isArray ? JSON.stringify(remainng) : (remainng[0] || null))
      await row.save()
      return { found, notFound, row: row.toView() }
    }
  }
  findByDisplay: Middleware = async (req, res) => {
    const display: string = req.query["display"] as string
    const findOptions: FindOptions = req.middleData.findOptions
    if (display)
      findOptions.where = this.Model.WhereFromDisplay?.(display)
    const rows = await this.Model.findAll(findOptions)
    return { rows: this.Model.toView(rows) }
  }
  create: Middleware = async (req, res) => {
    const Model = this.Model
    let user = req.middleData.user as UserEntity
    let data = Model.fromView(req.middleData.reqData) as any
    let created: KishiModel | null = null
    for (const attributeName in req.files) {
      const fileType = this.Model.rawAttributes[attributeName].type as KishiDataType
      if (!fileType?.isFile) continue
      data[attributeName] = req.files[attributeName]
    }
    if (Model.parentOptions) {
      const type = data[Model.parentOptions.descriminator] as string
      if (!Model.parentOptions.models.includes(type))
        throw `Unvalid Child Type ${type}`
      const ChildModel = Model.models[type]
      created = await ChildModel.Create(data, { user } as any) as KishiModel
    } else {
      created = await Model.Create(data, { user } as any) as KishiModel
    }
    const schema: string = (req.query["schema"] || "pure") as string
    let findOptions = Model.SchemaToFindOptions(schema, true)
    if (schemas[this.Model.name]?.[schema]) {
      findOptions = this.Model.PathsToFindOptions(schemas[this.Model.name][schema])
    }
    const row = await Model.findByPk(created.id, findOptions)
    if (!row)
      throw { message: `Create Failed` }
    return { row: row.toView() }
  }
  update: Middleware = async (req, res) => {
    const Model = this.Model
    let user = req.middleData.user as UserEntity
    const id: string = req.query["id"] as string
    const crudResponse: true | WhereAttributeHash = req.middleData.crudResponse
    const toUpdate = crudResponse != true ? await Model.findOne({ where: { [KOp("and")]: [{ id }, crudResponse] } }) : await Model.findByPk(id)
    if (!toUpdate)
      throw { message: `Instance Not Found` }
    let data = Model.fromView(req.middleData.reqData) as any
    for (const attributeName in req.files) {
      const fileType = this.Model.rawAttributes[attributeName].type as KishiDataType
      if (!fileType?.isFile) continue
      data[attributeName] = req.files[attributeName]
    }
    await toUpdate.Update(data, { user } as any)
    const schema: string = (req.query["schema"] || "pure") as string
    let findOptions = Model.SchemaToFindOptions(schema, true)
    if (schemas[this.Model.name]?.[schema]) {
      findOptions = this.Model.PathsToFindOptions(schemas[this.Model.name][schema])
    }
    const row = await Model.findByPk(toUpdate.id, findOptions)
    if (!row)
      throw { message: `Update Failed` }
    return { row: row.toView() }
  }
  upsert: Middleware = async (req, res) => {
    const Model = this.Model
    let user = req.middleData.user as UserEntity
    let data = Model.fromView(req.middleData.reqData) as any
    for (const attributeName in req.files) {
      const fileType = this.Model.rawAttributes[attributeName].type as KishiDataType
      if (!fileType?.isFile) continue
      data[attributeName] = req.files[attributeName]
    }
    const [upserted, newRecord] = await Model.Upsert(data, { user } as any)
    const schema: string = (req.query["schema"] || "pure") as string
    let findOptions = Model.SchemaToFindOptions(schema, true)
    if (schemas[this.Model.name]?.[schema]) {
      findOptions = this.Model.PathsToFindOptions(schemas[this.Model.name][schema])
    }
    const row = await Model.findByPk(upserted.id, findOptions)
    if (!row)
      throw { message: `Upsert Failed` }
    return { newRecord, row: row.toView(), }
  }
  destroy: Middleware = async (req, res) => {
    const Model = this.Model
    let user = req.middleData.user as UserEntity
    const id: string = req.query["id"] as string
    const crudResponse: true | WhereAttributeHash = req.middleData.crudResponse
    const toDestroy = crudResponse != true ? await Model.findOne({ where: { [KOp("and")]: [{ id }, crudResponse] } }) : await Model.findByPk(id)
    if (!toDestroy)
      throw { message: `Instance Not Found` }
    await toDestroy.destroy({ user } as any)
    return { deleted: true }
  }
  Route(): Router {
    let router: Router = Router();
    const Model = this.Model
    const {
      verifyUser, verifyCrud, parseReqData, parseFindOptions,
      findByDisplay, findById, findOneWhere, findAll, count, uploadFile, deleteFile,
      create, update, upsert, destroy
    } = this
    if (Model.WhereFromDisplay) {
      router.get("/byDisplay", MiddlewareChain(verifyUser, verifyCrud("read"), parseFindOptions, findByDisplay))
    }
    router.get("/", MiddlewareChain(verifyUser, verifyCrud("read"), parseFindOptions, findById))
    router.post("/one", MiddlewareChain(verifyUser, verifyCrud("read"), parseFindOptions, findOneWhere))
    router.get("/all", MiddlewareChain(verifyUser, verifyCrud("read"), parseFindOptions, findAll))
    router.post("/all", MiddlewareChain(verifyUser, verifyCrud("read"), parseFindOptions, findAll))
    router.get("/count", MiddlewareChain(verifyUser, verifyCrud("read"), parseFindOptions, count))
    router.post("/count", MiddlewareChain(verifyUser, verifyCrud("read"), parseFindOptions, count))
    for (const attributeName in Model.rawAttributes) {
      const fileType = Model.rawAttributes[attributeName].type as KishiDataType
      if (fileType?.isFile) {
        router.put(`/file/${attributeName}`, MiddlewareChain(verifyUser, verifyCrud("update"), uploadFile(attributeName)))
        router.delete(`/file/${attributeName}`, MiddlewareChain(verifyUser, verifyCrud("update"), deleteFile(attributeName)))
      }
    }
    router.post("/", MiddlewareChain(verifyUser, verifyCrud("create"), parseReqData, create))
    router.patch("/", MiddlewareChain(verifyUser, verifyCrud("update"), parseReqData, update))
    router.put("/", MiddlewareChain(verifyUser, verifyCrud("update"), parseReqData, upsert))
    router.delete("/", MiddlewareChain(verifyUser, verifyCrud("delete"), destroy))

    return router;
  }
}