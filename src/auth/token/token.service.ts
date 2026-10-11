import bcrypt from 'bcryptjs'
import { importJWK, jwtVerify, SignJWT } from 'jose'
import { v4 as uuidV4 } from 'uuid'
import type { Logger } from 'winston'

import type { IUserDto } from '../../admin/users/types/dto.interface'
import { isDev } from '../../app/app'
import { BaseConfig } from '../../common/abstract/base-config.common'
import { APP_REDIS_CONFIG } from '../../common/config/app.config'
import { JWKS_CONFIG, TOKEN_CONFIG } from '../../common/config/token.config'
import { checkCacheRedisClient } from '../../common/redis/utils/check-cache.util'
import {
	getRedisClientHashKey,
	setHashRedisClientWithEx,
} from '../../common/redis/utils/grud-redis.util'
import type { IErrorResponseApp } from '../../common/types/db/app.interface'
import { isVerifyTokenError } from '../../common/utils/app/checkType.utils'
import { getPrivateKey } from '../../common/utils/app/getKeys.utils'
import { base64UrlDecodeToString } from '../../common/utils/format/base64.util'
import { ApiError } from '../../common/utils/log/exists-error.log'
import type { IJwksData } from '../types/jwks.types'
import type {
	ExistTokenType,
	IResponseTokens,
	IUserJwtPayload,
	TokenWithStateAuthType,
} from '../types/token.type'
import type {
	IGenerateTokenService,
	TypeAuthUserService,
} from '../types/types.auth'
import { getJwks, getJwksLocal } from './jwks.service'
import type { TokenModel } from './token.model'

export class TokenService extends BaseConfig {
	// Base-config
	private accessExpire = TOKEN_CONFIG.ACCESS_EXPIRE
	private refreshExpire = TOKEN_CONFIG.REFRESH_EXPIRE
	private kidJwks = JWKS_CONFIG.KID
	private issuerApp = JWKS_CONFIG.ISSUER
	private audienceApp = JWKS_CONFIG.AUDIENCE

	constructor(private tokenModel: TokenModel, private logger: Logger) {
		super()
	}

	private async createAccessToken(
		user: Pick<IUserDto, 'id' | 'role'>
	): Promise<string | Pick<IErrorResponseApp, 'message'>> {
		if (
			!this.kidJwks ||
			!this.issuerApp ||
			!this.audienceApp ||
			!this.accessExpire ||
			!this.expireAccessJwtUnitCase
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
			.setExpirationTime(`${this.accessExpire}${this.expireAccessJwtUnitCase}`)
			.sign(privateKey)

		return jwt
	}

	private async createRefreshToken(
		user: Pick<IUserDto, 'id' | 'role'>
	): Promise<string | Pick<IErrorResponseApp, 'message'>> {
		if (
			!this.refreshExpire ||
			!this.kidJwks ||
			!this.issuerApp ||
			!this.audienceApp ||
			!this.expireRefreshJwtUnitCase
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
			.setExpirationTime(
				`${this.refreshExpire}${this.expireRefreshJwtUnitCase}`
			)
			.sign(privateKey)

		return jwt
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
	): Promise<IUserJwtPayload | Pick<IErrorResponseApp, 'message'>> {
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
						'Invalid JWT header ' +
						`${err instanceof Error ? err.message : 'internal server'}`,
				}
			}

			const kid = headerJson?.kid
			const alg = headerJson?.alg

			if (!kid) return { message: 'JWT header missing kid' }
			if (!alg) return { message: 'JWT header missing alg' }

			let jwksResponse: IJwksData | IJwksData[] | null | undefined
			let jwk: IJwksData | null | undefined

			if (isDev) {
				jwksResponse = await getJwksLocal()

				if (
					!Array.isArray(jwksResponse) &&
					!jwksResponse &&
					typeof jwksResponse !== 'undefined'
				) {
					return {
						message: 'Error jwks-response development',
					}
				}
			} else {
				jwksResponse = await getJwks()

				if (
					Array.isArray(jwksResponse) &&
					jwksResponse === null &&
					typeof jwksResponse !== 'undefined'
				)
					return {
						message: 'Error jwks-response production',
					}
			}

			jwk = jwksResponse

			if (!jwk)
				return {
					message: 'Bad-Request unknown kid',
				}

			if (jwk.use && jwk.use !== 'sig')
				return { message: 'JWK not for signature' }
			if (jwk.alg && jwk.alg !== alg)
				return { message: 'Algorithm mismatch between JWT header and JWK' }

			const key = await importJWK(jwk, jwk.alg)
			const resultJwtVerify = await jwtVerify<IUserJwtPayload>(token, key, {
				issuer: JWKS_CONFIG.ISSUER,
				audience: JWKS_CONFIG.AUDIENCE,
			})

			return resultJwtVerify.payload
		} catch (error) {
			return {
				message:
					'Token verification failed ' +
					`${error instanceof Error ? error.message : 'internal server'}`,
			}
		}
	}

	async saveToken(
		userId: string,
		refreshToken: string,
		expireToken: Date,
		stateAuth?: string
	): Promise<
		| TokenWithStateAuthType
		| {
				message: string
		  }
	> {
		if (!APP_REDIS_CONFIG.DEFAULT_EXPIRES_TIME_REDIS)
			return ApiError.InternalServer(
				'Error not set app config redis default time'
			)

		let existsToken: undefined | string | ExistTokenType
		const sessionKeyField = `session:id:${userId}`
		const sessionUserCache = await getRedisClientHashKey(
			'sessions',
			sessionKeyField
		)

		existsToken = await checkCacheRedisClient(
			sessionUserCache,
			() => this.tokenModel.findOne(userId),
			'token cache',
			'token not cache'
		)

		if (existsToken?.id && stateAuth && stateAuth !== existsToken?.state_auth) {
			return ApiError.BadRequest('This is maybe CSRF attack!', 409)
		}

		const hashToken = await bcrypt.hash(refreshToken, 10)
		const jsonCacheData = {
			id: uuidV4(),
			user_id: userId,
			refresh_token: hashToken,
			expires_token_at: expireToken,
			expires_forget_pass: null,
			expires_two_auth_code: null,
			is_two_auth_code: null,
			state_auth: stateAuth,
			created_at: Date.now(),
			updated_at: Date.now(),
		}
		let token: undefined | TokenWithStateAuthType | null

		if (sessionUserCache) {
			const updateSessionCache = await setHashRedisClientWithEx(
				'sessions',
				sessionKeyField,
				jsonCacheData
			)

			if (
				typeof updateSessionCache === 'object' &&
				'message' in updateSessionCache
			)
				return updateSessionCache

			const getSessionTokenCache = await getRedisClientHashKey(
				'sessions',
				sessionKeyField
			)

			if (!getSessionTokenCache)
				return ApiError.InternalServer('Error cache is not save!')

			token = JSON.parse(getSessionTokenCache) as TokenWithStateAuthType | null
		} else {
			token = await this.tokenModel.save(
				userId,
				existsToken,
				refreshToken,
				hashToken,
				expireToken,
				stateAuth
			)

			const newSessionCache = await setHashRedisClientWithEx(
				'sessions',
				sessionKeyField,
				token
			)

			if (typeof newSessionCache === 'object' && 'message' in newSessionCache)
				return newSessionCache
		}

		if (!token) {
			this.logger.error(`Error save token to user-id: ${userId}`)

			return { message: `Do not save session for user-id: ${userId}` }
		}

		return token
	}

	async refreshToken(refreshToken: string): TypeAuthUserService {
		const isVerifyToken = await this.verifyToken(refreshToken)

		if (isVerifyTokenError(isVerifyToken))
			return ApiError.BadRequest(isVerifyToken.message)

		if (!isVerifyToken.sub || typeof isVerifyToken.role === 'undefined')
			return ApiError.BadRequest('ID or Role is not have from verify token')

		const tokens = await this.generateTokens({
			id: isVerifyToken.sub,
			role: Number(isVerifyToken.role),
		})

		if (!tokens.refresh || typeof tokens.refresh !== 'string')
			return ApiError.BadRequest('Error generate token from new-refresh token')

		const expireRefreshTokenAt = this.isExpireUtil(
			this.maxAgeRefresh,
			this.expireRefreshJwtUnitCase
		)
		await this.saveToken(
			isVerifyToken.sub,
			tokens.refresh,
			expireRefreshTokenAt
		)

		return {
			accessToken: tokens.access,
			refreshToken: tokens.refresh,
			expireRefreshTokenAt,
		}
	}

	async deleteToken(
		userId: string,
		refreshToken: string
	): Promise<Pick<IResponseTokens, 'id' | 'refresh_token'> | null> {
		const tokenModel = await this.tokenModel.delete(userId, refreshToken)

		return tokenModel
	}
}
