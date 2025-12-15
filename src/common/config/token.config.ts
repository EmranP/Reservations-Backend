import fs from 'fs'
import path from 'path'
import { v4 as uuidV4 } from 'uuid'

export const PRIVATE_PEM = fs.readFileSync(
	path.join(__dirname, '../../../private.pem'),
	'utf8'
)

export const JWKS_CONFIG = {
	ISSUER: process.env.ISSUER || 'http://localhost:4200',
	AUDIENCE: process.env.AUDIENCE || 'api',
	JWKS_URL: process.env.JWKS_URL || 'https://api',
	KID: process.env.KID || `kid-${uuidV4()}`,
}

export const TOKEN_CONFIG = {
	ACCESS_EXPIRE: process.env.JWT_ACCESS_EXPIRES,
	REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRES,
}

export const JSON_BIN_CONFIG = {
	API_KEY: process.env.JSON_BIN_API_KEY || '',
	API_ACCESS_KEY: process.env.JSON_BIN_API_ACCESS_KEY || '',
	API_ID: process.env.JSON_BIN_API_ID || '',
}
