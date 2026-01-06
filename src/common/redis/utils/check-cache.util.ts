import type { Logger } from 'winston'

export const checkCacheRedisClient = async <T>(
	cacheData: string | null,
	cb: () => Promise<T>,
	loggerCache: Logger,
	logger: Logger
): Promise<T> => {
	if (cacheData) {
		loggerCache
		return JSON.parse(cacheData) as T
	}

	logger
	return await cb()
}
