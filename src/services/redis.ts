import { config } from '../config';

import { Router } from 'express';
import { createClient } from "redis"

import { KishiModel, KOp } from '../sequelize';
import { FileLogger } from '../utils/fileLogger';

const { redis: { url } } = config

export class RedisService {
	static async Init(models: { [name: string]: typeof KishiModel }, router: Router) {
		const logger = new FileLogger("redis")
		const redisClient = createClient({ url })
		redisClient.connect()
		redisClient.on("error", function (error) {
			logger.error(error);
		});
		redisClient.on('ready', async () => {
			logger.log("ready");
		});

	}
}





