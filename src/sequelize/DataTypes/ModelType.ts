import { Dialect, Sequelize } from "sequelize";
import { KishiModel, KishiModelAttributeColumnOptions } from "../";
import { JSONType } from "./JSONType";
export class ModelType extends JSONType {
  ts_typeStr?: any = `object`;
  key = "ModelType";
  dialect: Dialect = "mysql";
  dialectTypes = "mysql";
  modelName: string = "";
  attributeName: string = "";
  model: typeof KishiModel;
  constructor(model: typeof KishiModel) {
    super()
    this.ts_typeStr = model?.interfaceName
    this.getters?.push((value: any) => {
      if (!value) return value
      const data = this.model.build(value, { raw: true })
      return data
    })
    this.setters?.push((value: any) => {
      if (!value) return value
      const data = this.model.build(value)
      return (data as any).dataValues;
    })
    this.model = model
    return this;
  }
  Hook(Model: typeof KishiModel): void {
    const { attributeName, model } = this
    let attribute = Model.rawAttributes[attributeName] as KishiModelAttributeColumnOptions
    attribute.fromView = (value: any) => {
      return model.fromView(value)
    }
    attribute.toView = (value: any) => {
      return model.toView(value)
    }
    for (const hookName of ["beforeValidate", "afterValidate", "beforeCreate", "afterCreate"]) {
      (Model as any)[hookName](async (instance: KishiModel, options: any) => {
        if (!model.hasHooks(hookName as any)) return
        const { fields, hooks, skip } = options
        if (hooks == false) return
        if (skip?.includes(attributeName)) return
        if (fields && !fields.includes(attributeName)) return
        let target = instance.get(attributeName)
        if (!target)
          return
        await model.CallHooks(hookName, target, options)
        if (hookName.startsWith("before"))
          instance.set(attributeName, target)
      })
    }
    for (const hookName of ["beforeUpdate", "afterUpdate"]) {
      (Model as any)[hookName](async (instance: KishiModel, options: any) => {
        if (!model.hasHooks(hookName as any)) return
        const { fields, hooks, skip } = options
        if (hooks == false) return
        if (skip?.includes(attributeName)) return
        if (fields && !fields.includes(attributeName)) return
        let target = instance.get(attributeName)
        if (!target)
          return
        await model.CallHooks(hookName, target, options)
      })
    }
  }
  get defaultValue() {
    const defaultValue = {} as any;
    return defaultValue;
  }
}
(Sequelize as any).ModelType = ModelType;
