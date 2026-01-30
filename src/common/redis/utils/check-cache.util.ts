import { logger } from '../../utils/log/logger.log'

export const checkCacheRedisClient = async <T>(
	cacheData: string | string[] | null,
	cb: () => Promise<T>,
	loggerCacheMessage: string,
	loggerMessage: string
): Promise<T> => {
	const isArrayData = Array.isArray(cacheData)

	if (isArrayData && !cacheData.length) {
		logger.info(loggerMessage)
		return await cb()
	}

	if (cacheData) {
		if (isArrayData) {
			loggerCacheMessage
			return cacheData[0] ? (JSON.parse(cacheData[0]) as T) : await cb()
		}

		logger.info(loggerCacheMessage)

		const parserData = JSON.parse(cacheData)

		return typeof parserData === 'string' ? JSON.parse(parserData) : parserData
	}

	logger.info(loggerMessage)
	return await cb()
}
