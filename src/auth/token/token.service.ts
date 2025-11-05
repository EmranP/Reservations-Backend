import bcrypt from 'bcrypt'
import { importJWK, jwtVerify, SignJWT, type JWTPayload } from 'jose'
import type { JwtPayload } from 'jsonwebtoken'
import type { Logger } from 'winston'
import { JWKS_CONFIG, TOKEN_CONFIG } from '../../common/config/token.config'
import type { IErrorResponseApp } from '../../common/types/db/app.interface'
import { getPrivateKey } from '../../common/utils/app/getKeys.utils'
import { base64UrlDecodeToString } from '../../common/utils/format/base64.util'
import type { IUserDto } from '../dto/user.dto'
import type {
	IGenerateTokenService,
	TypeAuthTokenServiceFindOne,
} from '../types/auth.types'
import { getJwks } from './jwks.service'
import type { TokenModel } from './token.model'

export class TokenService {
	private accessExpire = TOKEN_CONFIG.ACCESS_EXPIRE
	private refreshExpire = TOKEN_CONFIG.REFRESH_EXPIRE
	private kidJwks = JWKS_CONFIG.KID
	private issuerApp = JWKS_CONFIG.ISSUER
	private audienceApp = JWKS_CONFIG.AUDIENCE
	// Cache
	private jwksCache: JwtPayload | null = null
	private jwksCacheAt = 0

	constructor(private tokenModel: TokenModel, private logger: Logger) {}

	private async createAccessToken(
		user: Pick<IUserDto, 'id' | 'role'>
	): Promise<string | Pick<IErrorResponseApp, 'message'>> {
		if (
			!this.kidJwks ||
			!this.issuerApp ||
			!this.audienceApp ||
			!this.accessExpire
		)
			return {
				message: 'Create access-token config is not set',
			}

		const privateKey = await getPrivateKey()
		const now = Math.floor(Date.now() / 1000)
		const jwt = await new SignJWT({
			sub: user.id,
			role: user.role,
			type: 'access',
		})
			.setProtectedHeader({ alg: 'RS256', kid: this.kidJwks })
			.setIssuer(this.issuerApp)
			.setAudience(this.audienceApp)
			.setIssuedAt(now)
			.setExpirationTime(this.accessExpire)
			.sign(privateKey)

		return jwt
	}

	// CreateRefresh in to token model
	private async createRefreshToken(
		user: Pick<IUserDto, 'id' | 'role'>
	): Promise<string | Pick<IErrorResponseApp, 'message'>> {
		if (
			!this.refreshExpire ||
			!this.kidJwks ||
			!this.issuerApp ||
			!this.audienceApp
		)
			return {
				message: 'Create refresh-token config is not set',
			}

		const privateKey = await getPrivateKey()
		const jwt = await new SignJWT({
			sub: user.id,
			role: user.role,
			type: 'refresh',
		})
			.setProtectedHeader({ alg: 'RS256', kid: this.kidJwks })
			.setIssuer(this.issuerApp)
			.setAudience(this.audienceApp)
			.setIssuedAt()
			.setExpirationTime(this.refreshExpire)
			.sign(privateKey)

		return jwt
	}

	async findToken(
		user: Pick<IUserDto, 'id'>,
		refreshToken: string
	): TypeAuthTokenServiceFindOne {
		const tokenData = await this.tokenModel.findOne(user.id)

		if (!Array.isArray(tokenData))
			return { message: 'Error find-token from service' }

		for (const row of tokenData) {
			const isMatch = await bcrypt.compare(refreshToken, row.refresh_token)
			if (isMatch) {
				return { id: row.id, refresh_token: row.refresh_token }
			}
		}

		return null
	}

	async generateTokens(
		user: Pick<IUserDto, 'id' | 'role'>
	): Promise<IGenerateTokenService> {
		const access = await this.createAccessToken(user)
		const refresh = await this.createRefreshToken(user)

		return {
			access,
			refresh,
		}
	}

	async verifyToken(
		token: string
	): Promise<JWTPayload | Pick<IErrorResponseApp, 'message'>> {
		if (this.jwksCache && Date.now() - this.jwksCacheAt < 60 * 60 * 1000)
			return this.jwksCache

		try {
			if (token.startsWith('Bearer ')) token = token.slice(7).trim()

			const parts = token.split('.')

			if (parts.length !== 3) return { message: 'Invalid JWT format' }

			const headerB64 = parts[0]
			let headerJson: { alg: string; kid: string } | undefined

			if (!headerB64)
				return {
					message: 'Bad-request No header base64 provide',
				}

			try {
				headerJson = JSON.parse(base64UrlDecodeToString(headerB64))
			} catch (err) {
				return {
					message:
						'Invalid JWT header: ' +
						`${err instanceof Error ? err.message : 'internal server'}`,
				}
			}

			const kid = headerJson?.kid
			const alg = headerJson?.alg

			if (!kid) return { message: 'JWT header missing kid' }
			if (!alg) return { message: 'JWT header missing alg' }

			const jwksResponse = await getJwks()

			const keys = Array.isArray(jwksResponse) ? jwksResponse : []
			const jwk = keys?.find(jwkItem => jwkItem.kid === kid)

			if (!jwk)
				return {
					message: 'Bad-Request unknown kid',
				}

			if (jwk.use && jwk.use !== 'sig')
				return { message: 'JWK not for signature' }
			if (jwk.alg && jwk.alg !== alg)
				return { message: 'Algorithm mismatch between JWT header and JWK' }

			const key = await importJWK(jwk, jwk.alg)
			const resultJwtVerify = await jwtVerify(token, key, {
				issuer: JWKS_CONFIG.ISSUER,
				audience: JWKS_CONFIG.AUDIENCE,
			})

			this.jwksCache = resultJwtVerify.payload
			this.jwksCacheAt = Date.now()

			return resultJwtVerify.payload
		} catch (error) {
			return {
				message:
					'Token verification failed: ' +
					`${error instanceof Error ? error.message : 'internal server'}`,
			}
		}
	}

	async saveToken(userId: string, refreshToken: string) {
		const hashToken = await bcrypt.hash(refreshToken, 10)

		await this.deleteToken(userId, refreshToken)

		const newToken = await this.tokenModel.create(userId, hashToken)

		if (!newToken) {
			this.logger.error(`Error save token to user-id: ${userId}`)

			return { message: `Do not save token for user-id: ${userId}` }
		}

		return newToken
	}

	async deleteToken(userId: string, refreshToken: string) {
		const tokenModel = await this.tokenModel.delete(userId, refreshToken)

		return tokenModel
	}
}
