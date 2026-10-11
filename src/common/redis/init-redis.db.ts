import { createClient } from 'redis'
import type { Logger } from 'winston'
import type { IJwksData } from '../../auth/types/jwks.types'
import { APP_REDIS_CONFIG } from '../config/app.config'

export const clientRedis = createClient({
	url: APP_REDIS_CONFIG.REDIS_URL,
})

clientRedis.on('error', err => {
	console.error('Redis Client Error:', err)
})

export const initRedisDB = async (
	logger: Logger,
	jwks: IJwksData
): Promise<void> => {
	try {
		if (!APP_REDIS_CONFIG || !APP_REDIS_CONFIG.DEFAULT_EXPIRES_TIME_REDIS) {
			return
		}

		const existJwksRedis = await clientRedis.hExists('jsonBin', 'keys')

		if (existJwksRedis) {
			logger.warn('Json-bin has success add to cache!')
			await clientRedis.hDel('jsonBin', 'keys')
		}

		const redisJsonBin = await clientRedis.hSet(
			'jsonBin',
			'keys',
			JSON.stringify(jwks)
		)

		redisJsonBin
			? logger.info('✅ "𝓡" accounts-hash has been added!')
			: logger.info('✅ "𝓡" accounts-hash has been empty!')

		await clientRedis.expire(
			'jsonBin',
			Number(APP_REDIS_CONFIG.DEFAULT_EXPIRES_TIME_REDIS)
		)
	} catch (error) {
		logger.error(
			error instanceof Error
				? error.message
				: 'Something was wrong from redis-init DB'
		)
	}
}
