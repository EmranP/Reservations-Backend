import { logger } from '../../utils/log/logger.log'

export const checkCacheRedisClient = async <T>(
	cacheData: string | null,
	cb: () => Promise<T>,
	loggerCacheMessage: string,
	loggerMessage: string
): Promise<T> => {
	if (cacheData) {
		logger.info(loggerCacheMessage)
		return JSON.parse(cacheData) as T
	}

	logger.info(loggerMessage)
	return await cb()
}
