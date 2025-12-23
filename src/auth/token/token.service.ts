import bcrypt from 'bcrypt'
import { importJWK, jwtVerify, SignJWT } from 'jose'
import type { JwtPayload } from 'jsonwebtoken'
import type { Logger } from 'winston'
import { isDev } from '../../app/app'
import { JWKS_CONFIG, TOKEN_CONFIG } from '../../common/config/token.config'
import type { IErrorResponseApp } from '../../common/types/db/app.interface'
import { isVerifyTokenError } from '../../common/utils/app/checkType.utils'
import { setDateUtil } from '../../common/utils/app/date.util'
import { getPrivateKey } from '../../common/utils/app/getKeys.utils'
import { base64UrlDecodeToString } from '../../common/utils/format/base64.util'
import { ApiError } from '../../common/utils/log/exists-error.log'
import type { IUserDto } from '../../user/dto/user.dto'
import { AuthBaseConfig } from '../abstract/auth-config.base'
import type { IJwksData } from '../types/jwks.types'
import type { IResponseTokens, IUserJwtPayload } from '../types/token.type'
import type {
	IGenerateTokenService,
	TypeAuthTokenServiceFindOne,
	TypeAuthUserService,
} from '../types/types.auth'
import { getJwks, getJwksLocal } from './jwks.service'
import type { TokenModel } from './token.model'

export class TokenService extends AuthBaseConfig {
	// Base-config
	private accessExpire = TOKEN_CONFIG.ACCESS_EXPIRE
	private refreshExpire = TOKEN_CONFIG.REFRESH_EXPIRE
	private kidJwks = JWKS_CONFIG.KID
	private issuerApp = JWKS_CONFIG.ISSUER
	private audienceApp = JWKS_CONFIG.AUDIENCE
	// Cache
	private jwksCache: JwtPayload | null = null
	private jwksCacheAt = 0

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

	//? Maybe remove this is method
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
	): Promise<IUserJwtPayload | Pick<IErrorResponseApp, 'message'>> {
		//! For production remove commit
		// if (this.jwksCache && Date.now() - this.jwksCacheAt < 60 * 60 * 1000)
		// 	return this.jwksCache

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

				jwk = jwksResponse
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

				jwk = jwksResponse?.find(jwkItem => jwkItem.kid === kid)
			}

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

			this.jwksCache = resultJwtVerify.payload
			this.jwksCacheAt = Date.now()

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
		| IResponseTokens
		| Omit<IResponseTokens, 'state_auth'>
		| {
				message: string
		  }
	> {
		const existsToken = await this.tokenModel.findOne(userId)

		if (existsToken?.id && stateAuth && stateAuth !== existsToken?.state_auth) {
			return ApiError.BadRequest('This is maybe CSRF attack!', 409)
		}

		const hashToken = await bcrypt.hash(refreshToken, 10)

		const token = await this.tokenModel.save(
			userId,
			refreshToken,
			hashToken,
			expireToken,
			stateAuth
		)

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

		if (!isVerifyToken.sub || !isVerifyToken.role)
			return ApiError.BadRequest('ID or Role is not have from verify token')

		const tokens = await this.generateTokens({
			id: isVerifyToken.sub,
			role: isVerifyToken.role,
		})

		if (!tokens.refresh || typeof tokens.refresh !== 'string')
			return ApiError.BadRequest('Error generate token from new-refresh token')

		const expireRefreshTokenAt = setDateUtil(this.maxAgeRefresh)
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
