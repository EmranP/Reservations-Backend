import type {
	RedisClientType,
	RedisFunctions,
	RedisModules,
	RedisScripts,
	RespVersions,
	TypeMapping,
} from 'redis'

export type AppRedisClientType = RedisClientType<
	RedisModules,
	RedisFunctions,
	RedisScripts,
	RespVersions,
	TypeMapping
>
