import fs from 'fs/promises'
import { exportJWK, importSPKI } from 'jose'
import path from 'path'
import { v4 } from 'uuid'

import { JSON_BIN_CONFIG, JWKS_CONFIG } from '../../common/config/token.config'
import { getRedisClientHashKey } from '../../common/redis/utils/grud-redis.util'
import { fetchJson } from '../../common/utils/app/fetchJson.util'
import { logger } from '../../common/utils/log/logger.log'
import type {
	IJwksData,
	IJwksKeysData,
	IResponseJwks,
} from '../types/jwks.types'

export const genJwks = async () => {
	const pathPublicPem = path.join(__dirname, '../../../public.pem')
	const publicPem = await fs.readFile(pathPublicPem, 'utf8')

	const key = await importSPKI(publicPem, 'RS256')
	const jwk = await exportJWK(key)

	jwk.kid = JWKS_CONFIG.KID
	jwk.use = 'sig'
	jwk.alg = 'RS256'

	const jwks = { keys: [jwk] }

	if (JSON_BIN_CONFIG.API_ID) {
		await fetch(`https://api.jsonbin.io/v3/b/${JSON_BIN_CONFIG.API_ID}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'X-Master-Key': JSON_BIN_CONFIG.API_KEY,
				'X-Access-Key': JSON_BIN_CONFIG.API_ACCESS_KEY,
			},
			body: JSON.stringify(jwks),
		})
	} else {
		await fetch('https://api.jsonbin.io/v3/b', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'X-Master-Key': JSON_BIN_CONFIG.API_KEY,
				'X-Access-Key': JSON_BIN_CONFIG.API_ACCESS_KEY,
			},
			body: JSON.stringify(jwks),
		})
	}
}

export const getJwks = async (): Promise<IJwksData | null> => {
	if (!JWKS_CONFIG.JWKS_URL) return null

	const redisKeysJwks = await getRedisClientHashKey('jsonBin', 'keys')

	if (redisKeysJwks) {
		const jsonData = JSON.parse(redisKeysJwks) as IJwksData

		return jsonData
	}

	const jwks = await fetchJson<IResponseJwks>(JWKS_CONFIG.JWKS_URL, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'X-Master-Key': JSON_BIN_CONFIG.API_KEY,
			'X-Access-Key': JSON_BIN_CONFIG.API_ACCESS_KEY,
		},
	})

	return jwks.record.keys[0] ?? null
}

// Local jwks

export const genJwksLocal = async (): Promise<void> => {
	// Path
	const pathPublicPem = path.join(__dirname, '../../../public.pem')
	const pathJwksFiles = path.join(__dirname, '../../../jwks.json')
	// Read
	const publicPem = await fs.readFile(pathPublicPem, 'utf8')

	const key = await importSPKI(publicPem, 'RS256')
	const jwk = await exportJWK(key)

	jwk.kid = JWKS_CONFIG.KID
	jwk.use = 'sig'
	jwk.alg = 'RS256'

	const jwks = { keys: [jwk] }

	try {
		await fs.access(pathJwksFiles)

		const oldJwks = await fs.readFile(pathJwksFiles, 'utf8')
		const newJwks = JSON.parse(oldJwks)

		newJwks.keys[0].kid = `kid-${v4()}`

		await fs.writeFile(pathJwksFiles, JSON.stringify(newJwks, null, 2))
		logger.warn('Jwks.json files has success edited')
	} catch (error) {
		logger.warn('Jwks.json files has success created')

		await fs.writeFile(pathJwksFiles, JSON.stringify(jwks, null, 2))
	}
}

export const getJwksLocal = async (): Promise<IJwksData | null> => {
	try {
		const redisKeysJwks = await getRedisClientHashKey('jsonBin', 'keys')

		if (redisKeysJwks) {
			const parseRedisData = JSON.parse(redisKeysJwks) as IJwksData

			return parseRedisData
		}

		const pathJwksFiles = path.join(__dirname, '../../../jwks.json')
		const jwksFile = await fs.readFile(pathJwksFiles, 'utf8')

		const jwks: null | IJwksKeysData = JSON.parse(jwksFile)

		if (!jwks || !jwks.keys[0]) return null

		return jwks.keys[0]
	} catch (error) {
		console.error(
			error instanceof Error
				? error.message
				: 'Something was wrong from get jwks local'
		)

		return null
	}
}
