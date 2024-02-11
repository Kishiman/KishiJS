import { config } from "../config";

import { KOp, KishiModel, KishiModelAttributeColumnOptions } from "../sequelize";


export class DataBinder {
	static async Init(models: { [name: string]: typeof KishiModel }) {
		for (const modelName in models) {
			const model = (models[modelName]);
			let binderss = Object.keys(model.rawAttributes).map(sourceField => {
				const attribute = model.rawAttributes[sourceField] as KishiModelAttributeColumnOptions
				const binders = Array.isArray(attribute.binder) ? attribute.binder! : [attribute.binder!].filter(b => b)
				return binders.map(binder => {
					binder.sourceField = sourceField;
					return binder
				})
			})
			let modelBinders: typeof binderss[number] = []
			for (const binders of binderss)
				modelBinders.push(...binders)
			for (const associationName in model.finalAssociations) {
				const associationBinders = modelBinders.filter(binder => binder.associationName == associationName)
				const targetFields = associationBinders.map(binder => binder.targetField)
				const sourceFields = associationBinders.map(binder => binder.sourceField!)
				const hardBinders = associationBinders.filter(binder => binder.hardBind)
				if (associationBinders.length == 0)
					continue
				const association = model.finalAssociations[associationName]
				const { Target } = association
				const { sourceKey, targetKey } = association
				let targetRows = await Target.findAll({ attributes: [targetKey, ...targetFields] })
				let sourceRows = await model.findAll({ attributes: ["id", sourceKey, ...sourceFields], where: { [sourceKey]: { [KOp("not")]: null } } })
				for (const source of sourceRows) {
					const target = targetRows.find(target => target.get(targetKey) == source.get(sourceKey))
					if (target) {
						for (const binder of associationBinders) {
							source.set(binder.sourceField!, target.get(binder.targetField))
						}
					} else if (hardBinders.length) {
						for (const binder of hardBinders) {
							source.set(binder.sourceField!, null)
						}
					}
					await source.save({ silent: true })
				}
				if (hardBinders.length) {
					let hardData: any = {}
					for (const binder of hardBinders) {
						hardData[binder.sourceField!] = null
					}
					await model.update(hardData, { where: { [sourceKey]: null }, silent: true })
				}
			}
		}
	}
}
