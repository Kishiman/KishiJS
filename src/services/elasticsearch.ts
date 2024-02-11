import { config } from '../config';

import elasticsearch from 'elasticsearch'
import cron from 'node-cron'
import { Router } from 'express';

import { KishiModel, KOp } from '../sequelize';
import { FileLogger } from '../utils/fileLogger';
import { KArray } from '../utils/array';

const { elasticsearch: { prefix, hosts } } = config

const logger = new FileLogger("elasticsearch")
let client: elasticsearch.Client


const createIndex = async (indexName: string) => {
	await client.indices.create({ index: indexName })
}
const exists = async (indexName: string) => {
	return await client.indices.exists({ index: indexName })
}

const bulk = async (body: any) => {
	return new Promise((resolve, reject) => {
		client.bulk({ body: body }, function (error, response) {
			if (error) {
				logger.error("Failed Bulk operation")
				logger.error(error)
				logger.error(body)
				return reject(error)
			}
			resolve(response)
		});
	})
}
const create = async (indexName: string, id: string, body: any) => {
	const response = await client.create({ index: indexName, type: indexName, id, body })
		.catch(err => {
			logger.error(err);
			logger.warn({ index: indexName, type: indexName, id, body });
		})
	return response
}
const deleteIndex = async (indexName: string) => {
	const res = await client.indices.delete({ index: indexName })
	logger.log("index deleted", res.response);
}
const update = async (indexName: string, id: string, body: any) => {
	const response = await client.update({ index: indexName, type: indexName, id, body: { doc: body } })
		.catch(err => {
			logger.error(err);
			logger.warn({ index: indexName, type: indexName, id, body: { doc: body } });
		})
	return response
}

export interface ElasticsearchOptions {
	name: string,
	schedule?: string;
	paths: string[];
	rowToData(row: KishiModel): any;
	update?: boolean;
}
export interface ElasticsearchSource {
	elasticsearchOptions: { [key: string]: ElasticsearchOptions }
}
export class ElasticsearchService {
	static IndexData(data: any, indexName: string): any[] {
		let indexData = []
		data = Array.isArray(data) ? data : [data]
		for (const _data of data) {
			indexData.push(
				{
					index: {
						_index: indexName,
						_type: indexName,
						_id: _data.id
					}
				}
			)
			indexData.push(_data)
		}
		return indexData
	}
	static async SearchAll(indexName: string, body: any): Promise<any[]> {
		let hits: any[] = []
		var responseQueue: elasticsearch.SearchResponse<any>[] = []
		const response = await client.search({
			size: 100,
			index: indexName,
			scroll: '30s',
			body: body
		})
		responseQueue.push(response)
		for (const res of responseQueue) {
			const _hits = res?.hits?.hits || []
			hits.push(...KArray.get(_hits, "_source"))
			if ((res?.hits?.total as any).value === hits.length) {
				break
			}
			if (res._scroll_id)
				responseQueue.push(
					await client.scroll({
						scrollId: res._scroll_id,
						scroll: '30s'
					})
				)
		}
		return hits
	}
	static async Init(models: { [name: string]: typeof KishiModel }, router: Router) {
		client = new elasticsearch.Client({ hosts });
		const res = await exists("last_fetch")
		if (res)
			await deleteIndex("last_fetch")
		await createIndex("last_fetch")
		for (const modelName in models) {
			const model = (models[modelName]);
			let options = (model as any as ElasticsearchSource)?.elasticsearchOptions
			if (!options)
				continue
			for (const key in options) {
				options[key].name = `${prefix}_${options[key].name.toLowerCase()}`
				const indexName = options[key].name
				try {
					await ElasticsearchService.Index(model, options[key])
				} catch (error) {
					logger.error(error);
				}
				cron.schedule(options[key].schedule || "* * * * *", async function () {
					ElasticsearchService.SyncIndex(model, options[key])
				})
				console.log(`/es/${modelName}/${key}`);
				router.get(`/es/${modelName}/${key}`, async (req, res) => {
					const hits = await this.SearchAll(indexName, {})
					res.status(200).send({ hits })
				})
				router.post(`/es/${modelName}/${key}`, async (req, res) => {
					const hits = await this.SearchAll(indexName, req.body)
					res.status(200).send({ hits })
				})

			}
		}
	}

	static async Index(Model: typeof KishiModel, options: ElasticsearchOptions) {
		const indexName = options.name
		let bulkData: any[] = [];
		const now = new Date()
		const where = {
			createdAt: {
				[KOp("lte")]: now
			}
		}
		await deleteIndex(indexName).catch(err => {
			logger.warn(`deleteIndex ${indexName}`);
			logger.warn(err);
		})
		await createIndex(indexName).catch(err => {
			logger.error(`createIndex ${indexName}`);
			logger.error(err);
		})
		let findOptions = Model.PathsToFindOptions(options.paths)
		findOptions.where = findOptions.where ? { [KOp("and")]: [findOptions.where, where] } : where
		const rows = await Model.findAll(findOptions)
		rows.forEach(row => {
			let data = options.rowToData(row)
			bulkData.push(...this.IndexData(data, indexName))
		});
		if (bulkData.length > 0) {
			bulk(bulkData)
		}
		const body = { query: { match: { name: indexName } } }
		const hits = await this.SearchAll('last_fetch', body)
		if (hits.length > 0) {
			update("last_fetch", indexName, { date: now.toISOString() })
		}
		else {
			await create("last_fetch", indexName, {
				name: indexName,
				date: now.toISOString()
			})
		}
	}

	static async ReIndex(Model: typeof KishiModel, options: ElasticsearchOptions, date: Date) {
		const indexName = options.name
		let bulkData: any[] = [];
		const now = new Date()
		const where = {
			createdAt: {
				[KOp("lt")]: now,
				[KOp("gte")]: date
			}
		}

		let findOptions = Model.PathsToFindOptions(options.paths)
		findOptions.where = findOptions.where ? { [KOp("and")]: [findOptions.where, where] } : where
		const rows = await Model.findAll(findOptions)

		rows.forEach(row => {
			let data = options.rowToData(row)
			bulkData.push(...this.IndexData(data, indexName))
		});
		if (bulkData.length > 0) {
			bulk(bulkData)
		}
		if (options.update) {
			const whereUp = {
				updatedAt: {
					[KOp("lt")]: now,
					[KOp("gte")]: date
				},
				createdAt: {
					[KOp("lt")]: date,
				}
			}
			findOptions = Model.PathsToFindOptions(options.paths)

			findOptions.where = findOptions.where ? { [KOp("and")]: [findOptions.where, whereUp] } : whereUp

			const rowsUp = await Model.findAll(findOptions)
			rowsUp.forEach(async row => {
				let data = options.rowToData(row)
				data = Array.isArray(data) ? data : [data]
				for (const _data of data) {
					update(indexName, _data.id, _data)
				}
			});
		}
		update("last_fetch", indexName, { date: now.toISOString() })
	}

	static async SyncIndex(Model: typeof KishiModel, options: ElasticsearchOptions) {
		const indexName = options.name
		const indexExist = await exists(indexName)
		if (!indexExist) {
			logger.warn(indexName, " not found");
			return await ElasticsearchService.Index(Model, options)
		}
		const body = { query: { match: { name: indexName } } }
		const hits = await this.SearchAll('last_fetch', body)
		if (hits.length > 0) {
			await ElasticsearchService.ReIndex(Model, options, new Date((hits[0].date)))
		} else {
			logger.log(indexName, " not found");
			await ElasticsearchService.Index(Model, options)
		}
	}
}





