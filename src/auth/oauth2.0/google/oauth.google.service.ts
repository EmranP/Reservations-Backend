import bcrypt from 'bcrypt'
import { createRemoteJWKSet, jwtVerify } from 'jose'
import { v4 as uuidV4 } from 'uuid'
import type { Logger } from 'winston'
import { APP_CONFIG, APP_OAUTH_CONFIG } from '../../../common/config/app.config'
import {
	googlePublicJwksUrl,
	googleUrl,
} from '../../../common/constants/auth.constant'
import { AUTH_METHOD } from '../../../common/constants/enum.constant'
import { genLinks } from '../../../common/constants/link.constant'
import type { IAppEnCrypto } from '../../../common/types/app/app.type'
import type { IErrorResponseApp } from '../../../common/types/db/app.interface'
import { isVerifyTokenError } from '../../../common/utils/app/checkType.utils'
import { decrypt, encrypt } from '../../../common/utils/app/crypto.util'
import { setDateUtil } from '../../../common/utils/app/date.util'
import { generateOAuthGoogleLink } from '../../../common/utils/app/generate.utils'
import { ApiError } from '../../../common/utils/log/exists-error.log'
import { UserGoogleDto } from '../../../user/dto/user.dto'
import { AuthBaseConfig } from '../../abstract/auth-config.base'
import type { AuthModel } from '../../auth.model'
import type {
	ICreateUserAccountDto,
	ICreateUserWithoutAccountDto,
} from '../../dto/oauth.dto'
import {
	isResponseGoogleDataApi,
	isResponseGoogleErrorDataApi,
	isResponseGoogleRefreshDataApi,
} from '../../pipe/oauth.pipe'
import type { TokenService } from '../../token/token.service'
import type {
	IResponseGoogleApi,
	TypeGoogleRefreshTokenResponse,
} from '../../types/api.types'
import type { ICommonGoogleBodyData } from '../../types/common.type'
import type { IUserGoogleJwtPayload } from '../../types/token.type'
import type {
	IUserOAuthGoogle,
	TypeUserOAuthGoogleRefresh,
} from '../../types/types.auth'
import type { OAuthModel } from '../oauth.model'
import { getGoogleToken } from './oauth.google.api'

export class OAuthGoogleService extends AuthBaseConfig {
	constructor(
		private model: OAuthModel,
		private authModel: AuthModel,
		private tokenService: TokenService,
		private logger: Logger
	) {
		super()
	}

	private googleClientId = APP_OAUTH_CONFIG.GOOGLE_CLIENT_ID
	private googleClientSecret = APP_OAUTH_CONFIG.GOOGLE_CLIENT_SECRET
	private googleClientRedirect = APP_OAUTH_CONFIG.GOOGLE_CLIENT_REDIRECT
	private googleClientGrantTypeAuthCode = 'authorization_code'
	private googleClientGrantTypeRefresh = 'refresh_token'
	private googlePublicJwks = createRemoteJWKSet(new URL(googlePublicJwksUrl))
	private defaultUserPass = APP_CONFIG.USER_DEFAULT_PASS

	async getGoogleUrl(): Promise<ApiError | string> {
		if (
			!this.googleClientId ||
			!this.googleClientSecret ||
			!this.googleClientRedirect
		)
			return ApiError.InternalServer('Google oauth config not set!')

		const url = generateOAuthGoogleLink(
			this.googleClientId,
			this.googleClientRedirect
		)

		return url
	}

	async getCommonGoogleBodyData(): Promise<ApiError | ICommonGoogleBodyData> {
		if (
			!this.googleClientId ||
			!this.googleClientSecret ||
			!this.googleClientRedirect
		)
			return ApiError.InternalServer('Google oauth config not set!')

		const commonData: ICommonGoogleBodyData = {
			client_id: this.googleClientId,
			client_secret: this.googleClientSecret,
			redirect_uri: this.googleClientRedirect,
		}

		return commonData
	}

	async verifyGoogleToken(
		idToken: string | undefined
	): Promise<IErrorResponseApp | IUserGoogleJwtPayload> {
		if (!idToken)
			return {
				message: 'ID token is not have!',
				status: 404,
			}

		const account = await jwtVerify<IUserGoogleJwtPayload>(
			idToken,
			this.googlePublicJwks,
			{
				algorithms: ['RS256'],
				issuer: googleUrl,
			}
		)

		if (!account || !account.payload)
			return {
				message: 'Error from verify-account google',
				status: 500,
			}

		return account.payload
	}

	async googleCodeHandler(code: string): Promise<ApiError | IUserOAuthGoogle> {
		if (!this.defaultUserPass)
			return ApiError.InternalServer(
				'App-config is not set default-pass for user'
			)

		const commonData = await this.getCommonGoogleBodyData()

		if ('message' in commonData) return commonData

		const dataBody = {
			...commonData,
			code,
			grant_type: this.googleClientGrantTypeAuthCode,
		}

		const responseGoogleData = await getGoogleToken(
			dataBody,
			{
				'Content-Type': 'application/json',
			},
			true
		)
		let googleData: undefined | IResponseGoogleApi | IErrorResponseApp

		if (isResponseGoogleDataApi(responseGoogleData)) {
			googleData = responseGoogleData
		}

		if (
			googleData !== null &&
			typeof googleData === 'object' &&
			'message' in googleData
		) {
			return ApiError.BadRequest(googleData.message, googleData.status)
		}

		if (googleData === null || typeof googleData === 'undefined') {
			return ApiError.BadRequest(
				'Error response from google code is have null!'
			)
		}

		const isVerifyGoogleAccount = await this.verifyGoogleToken(
			googleData.id_token
		)

		console.log(isVerifyGoogleAccount)
		if ('message' in isVerifyGoogleAccount) {
			return ApiError.InternalServer(
				typeof isVerifyGoogleAccount.message === 'string'
					? isVerifyGoogleAccount.message
					: 'Something was wrong'
			)
		}

		const accountEmail = isVerifyGoogleAccount.email
		const user = await this.authModel.getUserByEmail(accountEmail)
		const { resetPassLink } = genLinks(uuidV4)
		const newValuePass =
			typeof isVerifyGoogleAccount.at_hash === 'string'
				? isVerifyGoogleAccount.at_hash
				: this.defaultUserPass
		const newHasPass = await bcrypt.hash(newValuePass, 10)
		const accessHash = await bcrypt.hash(googleData.access_token, 10)
		let refreshHash: IAppEnCrypto | null = null

		if (googleData.refresh_token) {
			refreshHash = encrypt(googleData.refresh_token)
		} else {
			refreshHash = null
		}

		const calcExp =
			typeof isVerifyGoogleAccount.exp === 'number' &&
			isVerifyGoogleAccount.exp * 1000
		const calcExpireIn = Date.now() + googleData.expires_in * 1000
		const newExpireIn = new Date(calcExp || calcExpireIn)

		if (accountEmail === user?.email) {
			if (!isVerifyGoogleAccount.email_verified)
				return ApiError.BadRequest(
					'User is not verify google email please verified him!',
					409
				)

			const dataUpdateDto: ICreateUserAccountDto &
				ICreateUserWithoutAccountDto = {
				provider: 'google',
				types: 'openid-connect',
				accessToken: accessHash,
				expiresIn: newExpireIn,
				firstName: isVerifyGoogleAccount.name,
				email: isVerifyGoogleAccount.email,
				phone: '+993',
				password: user.password ?? newHasPass,
				picture: isVerifyGoogleAccount.picture,
				isVerify: isVerifyGoogleAccount.email_verified,
				authMethod: AUTH_METHOD.GOOGLE,
			}

			const updateUserGoogle = await this.model.updateUserOAuth(
				user.id,
				resetPassLink,
				dataUpdateDto
			)

			if (!updateUserGoogle?.id || !updateUserGoogle)
				return ApiError.InternalServer('Error from update account and user!')

			const userGoogle = new UserGoogleDto(updateUserGoogle)

			const tokens = await this.tokenService.generateTokens({
				id: updateUserGoogle.id,
				role: updateUserGoogle.role,
			})

			if (!tokens.refresh || typeof tokens.refresh !== 'string')
				return ApiError.InternalServer('Error refresh-token is not generate')

			const expireRefreshTokenAt = setDateUtil(this.maxAgeRefresh)
			await this.tokenService.saveToken(
				updateUserGoogle.id,
				tokens.refresh,
				expireRefreshTokenAt
			)

			return {
				user: userGoogle,
				accessToken: googleData.access_token,
				refreshToken: tokens.refresh,
				expiresIn: expireRefreshTokenAt,
			}
		} else {
			if (!isVerifyGoogleAccount.email_verified)
				return ApiError.BadRequest(
					'User is not verify google email please verified him!',
					409
				)

			const refreshNewValue =
				typeof refreshHash?.encrypted === 'string'
					? refreshHash.encrypted
					: null

			const dataCreateGoogleDto: ICreateUserAccountDto &
				ICreateUserWithoutAccountDto = {
				firstName: isVerifyGoogleAccount.name,
				email: isVerifyGoogleAccount.email,
				phone: '+993',
				password: newHasPass,
				picture: isVerifyGoogleAccount.picture,
				isVerify: isVerifyGoogleAccount.email_verified,
				authMethod: AUTH_METHOD.GOOGLE,
				provider: 'google',
				types: 'openid-connect',
				accessToken: accessHash,
				refreshToken: refreshNewValue,
				googleRefreshIv: refreshHash?.iv ?? null,
				googleRefreshTag: refreshHash?.tag ?? null,
				expiresIn: newExpireIn,
			}

			const newUserGoogle = await this.model.createUserOAuth(
				resetPassLink,
				AUTH_METHOD.GOOGLE,
				dataCreateGoogleDto
			)

			if (!newUserGoogle)
				return ApiError.InternalServer(
					'Error from create user-account with google'
				)

			const userGoogle = new UserGoogleDto(newUserGoogle)

			if (!userGoogle.id || typeof userGoogle.role === 'undefined')
				return ApiError.BadRequest('User google dto not found!')

			const tokens = await this.tokenService.generateTokens({
				id: userGoogle.id,
				role: userGoogle.role,
			})

			if (!tokens.refresh || typeof tokens.refresh !== 'string')
				return ApiError.InternalServer('Error refresh-token is not generate')

			const expireRefreshTokenAt = setDateUtil(this.maxAgeRefresh)
			await this.tokenService.saveToken(
				userGoogle.id,
				tokens.refresh,
				expireRefreshTokenAt
			)

			return {
				user: userGoogle,
				accessToken: googleData.access_token,
				refreshToken: tokens.refresh,
				expiresIn: expireRefreshTokenAt,
			}
		}
	}

	async googleRefreshToken(
		token: string
	): Promise<TypeUserOAuthGoogleRefresh | ApiError> {
		const now = new Date()
		const isVerifyToken = await this.tokenService.verifyToken(token)

		if (isVerifyTokenError(isVerifyToken))
			return ApiError.BadRequest(isVerifyToken.message)

		if (!isVerifyToken.sub || !isVerifyToken.role)
			return ApiError.BadRequest('ID or Role is not have from verify token')

		const userAccount = await this.model.findUserAccount(isVerifyToken.sub)

		if (
			!userAccount ||
			!userAccount.google_refresh_token_iv ||
			!userAccount.google_refresh_token_tag
		)
			return ApiError.NotFound('Not founded user data!')

		const decryptToken = decrypt(
			userAccount.refresh_token,
			userAccount.google_refresh_token_iv,
			userAccount.google_refresh_token_tag
		)

		const isTimeCheck =
			userAccount.expires_in &&
			now.getTime() >= userAccount.expires_in?.getTime()

		if (
			!this.googleClientGrantTypeRefresh ||
			!decryptToken ||
			!this.googleClientId ||
			!this.googleClientSecret
		)
			return ApiError.InternalServer('Error not set body data!')

		const dataBody = new URLSearchParams({
			grant_type: this.googleClientGrantTypeRefresh,
			refresh_token: decryptToken,
			client_id: this.googleClientId,
			client_secret: this.googleClientSecret,
		})

		if (isTimeCheck) {
			const googleResponse = await getGoogleToken(
				dataBody,
				{
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				false
			)
			let googleData: undefined | TypeGoogleRefreshTokenResponse

			if (
				typeof googleResponse === 'object' &&
				googleResponse !== null &&
				'message' in googleResponse &&
				typeof googleResponse.message === 'string' &&
				'status' in googleResponse &&
				typeof googleResponse.status === 'number'
			) {
				return ApiError.BadRequest(
					googleResponse.message,
					googleResponse.status
				)
			}

			if (isResponseGoogleErrorDataApi(googleResponse)) {
				return ApiError.BadRequest(
					googleResponse.error_description || googleResponse.error
				)
			}

			if (googleResponse === null || typeof googleResponse === 'undefined') {
				return ApiError.BadRequest(
					'Error response from google code is have null!'
				)
			}

			if (!isResponseGoogleRefreshDataApi(googleResponse))
				return ApiError.BadRequest('Error set googleResponse to googleData')

			googleData = googleResponse

			const calcExpireIn = Date.now() + googleData.expires_in * 1000
			const newGoogleExpireIn = new Date(calcExpireIn)
			const accessHash = await bcrypt.hash(googleData.access_token, 10)
			const newTokenAccount = await this.model.updateTokens(
				userAccount.user_id,
				accessHash,
				token,
				newGoogleExpireIn,
				googleData.token_type
			)

			if (!newTokenAccount)
				return ApiError.InternalServer('Error from update account tokens')

			const user = await this.authModel.getUserById(userAccount.user_id)

			if (!user) return ApiError.NotFound('User not founded!!!')

			const tokens = await this.tokenService.generateTokens({
				id: user.id,
				role: user.role,
			})

			if (!tokens.refresh || typeof tokens.refresh !== 'string')
				return ApiError.InternalServer('Error refresh-token is not generate')

			const expireRefreshTokenAt = setDateUtil(this.maxAgeRefresh)
			await this.tokenService.saveToken(
				user.id,
				tokens.refresh,
				expireRefreshTokenAt
			)

			return {
				accessToken: googleData.access_token,
				refreshToken: tokens.refresh,
				expiresIn: expireRefreshTokenAt,
			}
		} else {
			return ApiError.BadRequest('AccessToken is not expired!', 409)
		}
	}
}
