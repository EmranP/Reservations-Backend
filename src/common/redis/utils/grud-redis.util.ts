import { APP_REDIS_CONFIG } from '../../config/app.config'
import { ApiError } from '../../utils/log/exists-error.log'
import { clientRedis } from '../init-redis.db'

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
): Promise<1 | ApiError> => {
	const newUserEmailCache = await clientRedis.hSetEx(hashKey, {
		[fieldKey]: JSON.stringify(fieldValue),
	})
	const newUsersEmailExpireCache = await clientRedis.pExpire(hashKey, expire)

	if (!newUserEmailCache || !newUsersEmailExpireCache)
		return ApiError.InternalServer('Error from save new user-email cache')

	return newUserEmailCache
}

export const getAllListRedisClient = async (
	listKeys: string
): Promise<string[] | []> => {
	const listData = await clientRedis.lRange(listKeys, 0, -1)

	return !listData.length ? [] : listData
}

export const setListRedisClientWIthEx = async <T>(
	listKeys: string,
	data: T[],
	expire: number = Number(APP_REDIS_CONFIG.ONE_DAY_EXPIRES_TIME_REDIS)
): Promise<ApiError | number> => {
	const addListData = await clientRedis.LPUSH(listKeys, JSON.stringify(data))
	const newExpireListCache = await clientRedis.pExpire(listKeys, expire)

	if (!addListData || !newExpireListCache)
		return ApiError.BadRequest(
			'Error from cache is not success added list-data!'
		)

	return addListData
}

export const delHashRedisClient = async (
	hashKey: string,
	fieldKey: string
): Promise<ApiError | number> => {
	const removeData = await clientRedis.HDEL(hashKey, fieldKey)
	console.log(removeData)
	if (!removeData)
		return ApiError.BadRequest('Error from remove hash-field cache')

	return removeData
}
