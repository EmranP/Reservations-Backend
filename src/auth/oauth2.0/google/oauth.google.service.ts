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
import type { IErrorResponseApp } from '../../../common/types/db/app.interface'
import { generateOAuthGoogleLink } from '../../../common/utils/app/generate.utils'
import { ApiError } from '../../../common/utils/log/exists-error.log'
import { UserGoogleDto } from '../../../user/dto/user.dto'
import type { AuthModel } from '../../auth.model'
import type {
	ICreateUserAccountDto,
	ICreateUserWithoutAccountDto,
} from '../../dto/oauth.dto'
import type { ICommonGoogleBodyData } from '../../types/common.type'
import type { IUserGoogleJwtPayload } from '../../types/token.type'
import type { IUserOAuthGoogle } from '../../types/types.auth'
import { getGoogleToken } from './oauth.google.api'
import type { OAuthGoogleModel } from './oauth.google.model'

export class OAuthGoogleService {
	constructor(
		private model: OAuthGoogleModel,
		private authModel: AuthModel,
		private logger: Logger
	) {}

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

		const responseGoogleData = await getGoogleToken(dataBody)

		if (
			responseGoogleData !== null &&
			typeof responseGoogleData === 'object' &&
			'message' in responseGoogleData
		) {
			return ApiError.BadRequest(
				responseGoogleData.message,
				responseGoogleData.status
			)
		}

		if (responseGoogleData === null) {
			return ApiError.BadRequest(
				'Error response from google code is have null!'
			)
		}

		const isVerifyGoogleAccount = await this.verifyGoogleToken(
			responseGoogleData.id_token
		)

		if ('message' in isVerifyGoogleAccount)
			return ApiError.InternalServer(
				typeof isVerifyGoogleAccount.message === 'string'
					? isVerifyGoogleAccount.message
					: 'Something was wrong'
			)

		const accountEmail = isVerifyGoogleAccount.email
		const user = await this.authModel.getUserByEmail(accountEmail)
		const { resetPassLink } = genLinks(uuidV4)

		const newValuePass =
			typeof isVerifyGoogleAccount.at_hash === 'string'
				? isVerifyGoogleAccount.at_hash
				: this.defaultUserPass
		const newHasPass = await bcrypt.hash(newValuePass, 10)
		const accessHash = await bcrypt.hash(responseGoogleData.access_token, 10)
		let refreshHash: string | null = null

		if (responseGoogleData.refresh_token) {
			refreshHash = await bcrypt.hash(responseGoogleData.refresh_token, 10)
		} else {
			refreshHash = null
		}

		const calcExp =
			typeof isVerifyGoogleAccount.exp === 'number' &&
			isVerifyGoogleAccount.exp * 1000
		const calcExpireIn = Date.now() + responseGoogleData.expires_in * 1000
		const newExpireIn = new Date(calcExp || calcExpireIn)

		// Add transition
		if (accountEmail === user?.email) {
			if (!isVerifyGoogleAccount.email_verified)
				return ApiError.BadRequest(
					'User is not verify google email please verified him!',
					409
				)

			const existsRefresh = await this.model.findUserAccount(user.id)

			const dataUpdateAccountDto: ICreateUserAccountDto = {
				provider: 'google',
				types: 'openid-connect',
				accessToken: accessHash,
				refreshToken: existsRefresh?.refresh_token ?? refreshHash,
				expiresIn: newExpireIn,
			}
			const dataUpdateUserDto: ICreateUserWithoutAccountDto = {
				firstName: isVerifyGoogleAccount.name,
				email: isVerifyGoogleAccount.email,
				phone: '+993',
				password: user.password ?? newHasPass,
				picture: isVerifyGoogleAccount.picture,
				isVerify: isVerifyGoogleAccount.email_verified,
				authMethod: AUTH_METHOD.GOOGLE,
			}

			const updateAccount = await this.model.updateUserAccount(
				user.id,
				dataUpdateAccountDto
			)
			const updateUser = await this.model.updateUser(
				user.id,
				dataUpdateUserDto,
				resetPassLink
			)

			if (!updateAccount || !updateUser)
				return ApiError.InternalServer('Error from update account and user!')

			const userGoogle = new UserGoogleDto(updateUser)

			return {
				user: userGoogle,
				accessToken: responseGoogleData.access_token,
				refreshToken: responseGoogleData.refresh_token ?? null,
				expiresIn: newExpireIn,
			}
		} else {
			if (!isVerifyGoogleAccount.email_verified)
				return ApiError.BadRequest(
					'User is not verify google email please verified him!',
					409
				)

			const dataCreateUserDto: ICreateUserWithoutAccountDto = {
				firstName: isVerifyGoogleAccount.name,
				email: isVerifyGoogleAccount.email,
				phone: '+993',
				password: newHasPass,
				picture: isVerifyGoogleAccount.picture,
				isVerify: isVerifyGoogleAccount.email_verified,
				authMethod: AUTH_METHOD.GOOGLE,
			}
			const dataCreateAccountDto: ICreateUserAccountDto = {
				provider: 'google',
				types: 'openid-connect',
				accessToken: accessHash,
				refreshToken: refreshHash,
				expiresIn: newExpireIn,
			}

			const newUser = await this.model.createUserWithoutAccount(
				dataCreateUserDto,
				resetPassLink,
				AUTH_METHOD.GOOGLE
			)

			if (!newUser)
				return ApiError.InternalServer('Error from create user with google!')

			const newAccount = await this.model.createUserAccount(
				newUser.id,
				dataCreateAccountDto
			)

			if (!newAccount)
				return ApiError.InternalServer(
					'Error from create user-account with google'
				)

			const userGoogle = new UserGoogleDto(newUser)

			return {
				user: userGoogle,
				accessToken: responseGoogleData.access_token,
				refreshToken: responseGoogleData.refresh_token ?? null,
				expiresIn: newExpireIn,
			}
		}
	}

	async googleRefreshToken(refreshToken: string) {}
}
