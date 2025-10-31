import fs from 'fs'
import path from 'path'

export const PRIVATE_PEM = fs.readFileSync(
	path.join(__dirname, '../../../private.pem'),
	'utf8'
)

export const JWKS_CONFIG = {
	ISSUER: process.env.ISSUER,
	AUDIENCE: process.env.AUDIENCE,
	JWKS_URL: process.env.JWKS_URL,
}

export const TOKEN_CONFIG = {
	ACCESS_EXPIRE: process.env.JWT_ACCESS_EXPIRES,
	REFRESH_EXPIRE: process.env.JWT_REFRESH_EXPIRES,
}
