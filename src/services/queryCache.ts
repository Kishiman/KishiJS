import { config } from "../config";

import { Router } from "express";
import { CountOptions, CreateOptions, FindOptions, GroupedCountResultItem } from "sequelize";
import { cloneDeep } from "lodash";

import { KishiModel } from "../sequelize";
import { FileLogger } from "../utils/fileLogger";
import { Cache, CachePayLoad } from "../utils/cache";
import { PromiseSub } from "../utils/promise";

const logger = new FileLogger("queryCache")

const cacher = new Cache()
export class QueryCacheService {
	static invalidateData(model: typeof KishiModel, transaction?: CreateOptions<any>["transaction"]) {
		if (transaction)
			transaction?.afterCommit(() => cacher.ClearByTag(model.name))
		else
			cacher.ClearByTag(model.name)
	}
	static Init(models: { [name: string]: typeof KishiModel }, router: Router) {
		async function findAll(this: typeof KishiModel, options?: FindOptions | undefined): Promise<KishiModel[] | KishiModel | null> {
			options = options || {}
			let cacheObject: any = cloneDeep(options)
			if (options.transaction) {
				return await (this as any).cache_findAll(options) as KishiModel[] | KishiModel | null
			}
			const cacheKey = this.name + ".findAll:" + JSON.stringify(cacheObject)
			const cache = await cacher.GetCacheOrPromise(cacheKey, { timeout: 60 })
			if ("data" in (cache as CachePayLoad)) {
				logger.log("data from cache", cacheKey)
				return cloneDeep((cache as CachePayLoad).data) as KishiModel[] | KishiModel | null
			}
			const sub = cache as PromiseSub<[KishiModel[] | KishiModel | null, string[]]>
			try {
				const dependencies = this.FindOptionsToDependencies(options)
				const result = await (this as any).cache_findAll(options) as KishiModel[] | KishiModel | null
				sub.resolve([result, dependencies])
				return result
			} catch (error) {
				console.error(error);
				sub.reject(error)
				throw error
			}
		}
		async function count(this: typeof KishiModel, options?: CountOptions | undefined): Promise<number | GroupedCountResultItem[]> {
			options = options || {}
			let cacheObject: any = cloneDeep(options)
			if (options.transaction) {
				return await (this as any).cache_count(options) as number | GroupedCountResultItem[]
			}
			const cacheKey = this.name + ".count:" + JSON.stringify(cacheObject)
			const cache = await cacher.GetCacheOrPromise(cacheKey, { timeout: 60 })
			if ("data" in (cache as CachePayLoad)) {
				return cloneDeep((cache as CachePayLoad).data) as number | GroupedCountResultItem[]
			}
			const sub = cache as PromiseSub<[number | GroupedCountResultItem[], string[]]>
			try {
				const dependencies = this.FindOptionsToDependencies(options)
				const result = await (this as any).cache_count(options) as number | GroupedCountResultItem[]
				sub.resolve([result, dependencies])
				return result
			} catch (error) {
				sub.reject(error)
				throw error
			}
		}
		for (const modelName in models) {
			const model = (models[modelName]);
			//Implement Cache
			(model as any).cache_findAll = (model as any).findAll.bind(model);
			(model as any).findAll = findAll.bind(model);
			(model as any).cache_count = (model as any).count.bind(model);
			(model as any).count = count.bind(model);
			model.afterCreate((row, options) => { this.invalidateData(model, options.transaction) })
			model.afterBulkCreate((rows, options) => { this.invalidateData(model, options.transaction) })
			model.afterSave((row, options) => { this.invalidateData(model, options.transaction) })
			model.afterUpdate((row, options) => { this.invalidateData(model, options.transaction) })
			model.afterBulkUpdate((options) => { this.invalidateData(model, options.transaction) })
			model.afterDestroy((row, options) => { this.invalidateData(model, options.transaction) })
			model.afterBulkDestroy((options) => { this.invalidateData(model, options.transaction) })
		}
	}
}
