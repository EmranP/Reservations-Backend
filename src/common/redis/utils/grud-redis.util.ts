import { APP_REDIS_CONFIG } from '../../config/app.config'
import type { RedisEntityMapType } from '../../types/app/redis.types'
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
	keys: string,
	keysIds: string,
	limit: number,
	offset: number
): Promise<string[] | null[]> => {
	const ids: string[] = await clientRedis.zRange(keys, offset, limit)

	if (!ids.length) return []

	const pipeline = clientRedis.multi()
	ids.forEach(id => pipeline.hGet(keysIds, id))

	const results = await pipeline.exec()

	return results
		.map(item => {
			try {
				return item
			} catch (error) {
				return [null]
			}
		})
		.filter(raw => typeof raw === 'string')
}

export const isSuccessReply = (reply: unknown): boolean =>
	reply === 1 || reply === 'OK'

export const setListRedisClientWIthEx = async <
	K extends keyof RedisEntityMapType
>(
	listKeys: string,
	listKeyIds: string,
	data: RedisEntityMapType[K],
	expire: number = Number(APP_REDIS_CONFIG.ONE_DAY_EXPIRES_TIME_REDIS)
): Promise<ApiError | number> => {
	const pipeline = clientRedis.multi()
	data?.forEach(item => {
		pipeline.hSetEx(listKeyIds, {
			[item.id]: JSON.stringify(item),
		})

		pipeline.zAdd(listKeys, [
			{ score: new Date(item.created_at).getTime(), value: item.id },
		])
	})
	const resultsPipeline = await pipeline.exec()
	if (!resultsPipeline) {
		return ApiError.InternalServer('Redis pipeline failed')
	}

	const hasSuccess = resultsPipeline.some(item => {
		if (!item) return false
		return isSuccessReply(item)
	})

	if (!hasSuccess) {
		return ApiError.InternalServer('Redis pipeline has no successful commands')
	}

	const expireListKeysCache = await clientRedis.pExpire(listKeys, expire)
	const expireListKeysIdsCache = await clientRedis.pExpire(listKeyIds, expire)

	if (!expireListKeysCache || !expireListKeysIdsCache)
		return ApiError.InternalServer('Error set expires to cache-list')

	return 1
}

export const delHashRedisClient = async (
	hashKey: string,
	fieldKey: string
): Promise<ApiError | number> => {
	const removeData = await clientRedis.HDEL(hashKey, fieldKey)

	if (!removeData)
		return ApiError.BadRequest('Error from remove hash-field cache')

	return removeData
}
