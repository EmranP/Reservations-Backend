import { logger } from '../../utils/log/logger.log'

export const isString = (v: unknown): v is string => typeof v === 'string'

export function safeJsonParse<T>(value: string): T | null {
	try {
		return JSON.parse(value) as unknown as T
	} catch {
		return null
	}
}

export const checkCacheRedisClient = async <T>(
	cacheData: string | string[] | null | null[],
	cb: () => Promise<T>,
	loggerCacheMessage: string,
	loggerMessage: string
): Promise<T> => {
	if (cacheData === null) {
		logger.info(loggerMessage)
		return cb()
	}

	if (Array.isArray(cacheData)) {
		const parsed = cacheData
			.filter(isString)
			.map(safeJsonParse)
			.filter((v): v is T => v !== null)

		if (parsed.length === 0) {
			logger.info(loggerMessage)
			return cb()
		}

		logger.info(loggerCacheMessage)
		return parsed as unknown as T
	}

	if (typeof cacheData === 'string') {
		let parsed = JSON.parse(cacheData)

		if (typeof parsed === 'string') {
			parsed = JSON.parse(JSON.parse(cacheData))
		}

		if (parsed === null) {
			logger.info(loggerMessage)
			return cb()
		}

		logger.info(loggerCacheMessage)
		return parsed
	}

	logger.info(loggerMessage)
	return cb()
}
