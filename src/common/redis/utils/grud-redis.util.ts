import { clientRedis } from '../../../index'
import { APP_REDIS_CONFIG } from '../../config/app.config'
import { ApiError } from '../../utils/log/exists-error.log'

export const getRedisClientHashKey = async (
	key: string,
	field: string
): Promise<string | null> => clientRedis.hGet(key, field)

export const getRedisClientKey = async (key: string): Promise<string | null> =>
	await clientRedis.get(key)

export const setHashRedisClient = async <T>(
	key: string,
	newFieldKey: string,
	newFieldValue: T
): Promise<number | ApiError> => {
	const newCacheData = await clientRedis.hSet(key, {
		[newFieldKey]: JSON.stringify(newFieldValue),
	})

	if (!newCacheData)
		return ApiError.InternalServer('Error from save new user-email cache')

	return newCacheData
}

export const setHashRedisClientWithEx = async <T>(
	hashKey: string,
	fieldKey: string,
	fieldValue: T,
	expire: number = Number(APP_REDIS_CONFIG.DEFAULT_EXPIRES_TIME_REDIS)
) => {
	const newUserEmailCache = await clientRedis.hSetEx(hashKey, {
		[fieldKey]: JSON.stringify(fieldValue),
	})
	const newUsersEmailExpireCache = await clientRedis.pExpire(hashKey, expire)

	if (!newUserEmailCache || !newUsersEmailExpireCache)
		return ApiError.InternalServer('Error from save new user-email cache')

	return newUserEmailCache
}

export const setExRedisClient = async () => {}
