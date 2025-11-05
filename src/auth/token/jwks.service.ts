import fs from 'fs'
import { exportJWK, importSPKI } from 'jose'
import path from 'path'
import { JSON_BIN_CONFIG, JWKS_CONFIG } from '../../common/config/token.config'
import { fetchJson } from '../../common/utils/app/fetchJson.util'
import type { IJwksKeysData, IResponseJwks } from '../types/jwks.types'

let jwksCache: IJwksKeysData[] | null = null
let jwksCacheAt = 0

export const genJwks = async () => {
	const publicPem = fs.readFileSync(
		path.join(__dirname, '../../../public.pem'),
		'utf8'
	)

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

export const getJwks = async (): Promise<IJwksKeysData[] | null> => {
	if (jwksCache && Date.now() - jwksCacheAt < 60 * 60 * 1000) return jwksCache

	if (!JWKS_CONFIG.JWKS_URL) return null

	const jwks = await fetchJson<IResponseJwks>(JWKS_CONFIG.JWKS_URL, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'X-Master-Key': JSON_BIN_CONFIG.API_KEY,
			'X-Access-Key': JSON_BIN_CONFIG.API_ACCESS_KEY,
		},
	})

	jwksCache = jwks.record.keys
	jwksCacheAt = Date.now()

	return jwks.record.keys
}
