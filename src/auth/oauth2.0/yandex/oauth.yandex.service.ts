import bcrypt from 'bcryptjs'
import { v4 as uuidV4 } from 'uuid'
import type { Logger } from 'winston'
import { APP_OAUTH_YANDEX_CONFIG } from '../../../common/config/app.config'
import {
	yandexInfoApi,
	yandexOAuthToken,
	yandexUserAvatarUrl,
} from '../../../common/constants/auth.constant'
import { AUTH_METHOD } from '../../../common/constants/enum.constant'
import { genLinks } from '../../../common/constants/link.constant'
import type { IAppEnCrypto } from '../../../common/types/app/app.type'
import { isVerifyTokenError } from '../../../common/utils/app/checkType.utils'
import { decrypt, encrypt } from '../../../common/utils/app/crypto.util'
import { generateOAuthYandexLink } from '../../../common/utils/app/generate.utils'
import { ApiError } from '../../../common/utils/log/exists-error.log'
import type { AuthModel } from '../../auth.model'
import type {
	IUserAccountDto,
	IUserWithoutAccountDto,
} from '../../dto/oauth.dto'
import {
	isResponseErrorDataApi,
	isResponseYandexInfoApi,
	isResponseYandexTokenApi,
} from '../../pipe/oauth.pipe'
import type { TokenService } from '../../token/token.service'
import type {
	IResponseYandexInfo,
	IResponseYandexTokenApi,
} from '../../types/api.types'
import type { ICommonOAuthBodyData } from '../../types/common.type'
import type { IUserOAuth, TypeUserOAuthRefresh } from '../../types/types.auth'
import { getOAuth, postOAuth } from '../oauth.api'
import type { OAuthModel } from '../oauth.model'
import { OAuthService } from '../oauth.service'
export class OAuthYandexService extends OAuthService {
	constructor(
		private model: OAuthModel,
		private service: OAuthService,
		private authModel: AuthModel,
		private tokenService: TokenService,
		private logger: Logger
	) {
		super()
	}

	private yandexClientID = APP_OAUTH_YANDEX_CONFIG.YANDEX_CLIENT_ID
	private yandexClientSecret = APP_OAUTH_YANDEX_CONFIG.YANDEX_CLIENT_SECRET
	private yandexClientRedirect = APP_OAUTH_YANDEX_CONFIG.YANDEX_CLIENT_REDIRECT

	public async getYandexUrl(
		state: string | undefined
	): Promise<ApiError | string> {
		return await this.service.getOauthUrl(
			state,
			this.yandexClientID,
			this.yandexClientSecret,
			this.yandexClientRedirect,
			() =>
				generateOAuthYandexLink(
					this.yandexClientID,
					'code',
					this.yandexClientRedirect,
					state
				)
		)
	}

	private async getCommonYandexBodyData(): Promise<
		ApiError | Omit<ICommonOAuthBodyData, 'redirect_uri'>
	> {
		if (
			!this.yandexClientID ||
			!this.yandexClientSecret ||
			!this.yandexClientRedirect
		)
			return ApiError.InternalServer(
				'Yandex oauth config not set from common body data!'
			)

		const commonData: Omit<ICommonOAuthBodyData, 'redirect_uri'> = {
			client_id: this.yandexClientID,
			client_secret: this.yandexClientSecret,
		}

		return commonData
	}

	public async yandexCodeHandler(
		code: string,
		state: string
	): Promise<ApiError | IUserOAuth> {
		if (!this.defaultUserPass)
			return ApiError.InternalServer(
				'App-config is not set default-pass for user'
			)

		const commonData = await this.getCommonYandexBodyData()

		if ('message' in commonData) return commonData

		const dataBody = {
			...commonData,
			code,
			grant_type: 'authorization_code',
			state,
		}

		const headerData = {
			'Content-Type': 'application/x-www-form-urlencoded',
		}

		const responseYandexTokenData = await postOAuth(
			`${yandexOAuthToken}/token`,
			'POST',
			headerData,
			false,
			dataBody
		)
		let yandexToken: undefined | IResponseYandexTokenApi

		if (
			responseYandexTokenData !== null &&
			typeof responseYandexTokenData === 'object' &&
			'error' in responseYandexTokenData &&
			typeof responseYandexTokenData.error === 'string' &&
			'error_description' in responseYandexTokenData &&
			typeof responseYandexTokenData.error_description === 'string'
		) {
			return ApiError.BadRequest(
				responseYandexTokenData.error_description ||
					responseYandexTokenData.error,
				400
			)
		}

		if (isResponseYandexTokenApi(responseYandexTokenData)) {
			yandexToken = responseYandexTokenData
		}

		if (yandexToken === null || typeof yandexToken === 'undefined') {
			return ApiError.BadRequest(
				'Error response from yandex code is have null!'
			)
		}

		const headersYandexInfo = {
			Authorization: `OAuth ${yandexToken.access_token}`,
		}

		const responseYandexInfoData = await getOAuth(
			yandexInfoApi,
			'GET',
			headersYandexInfo
		)
		let yandexInfo: undefined | IResponseYandexInfo

		if (
			responseYandexInfoData !== null &&
			typeof responseYandexInfoData === 'object' &&
			'error' in responseYandexInfoData &&
			typeof responseYandexInfoData.error === 'string' &&
			'error_description' in responseYandexInfoData &&
			typeof responseYandexInfoData.error_description === 'string'
		) {
			return ApiError.BadRequest(
				responseYandexInfoData.error_description ||
					responseYandexInfoData.error,
				400
			)
		}

		if (isResponseYandexInfoApi(responseYandexInfoData)) {
			yandexInfo = responseYandexInfoData
		}

		if (yandexInfo === null || typeof yandexInfo === 'undefined') {
			return ApiError.BadRequest(
				'Error response from yandex-info is have null!'
			)
		}

		const user = await this.authModel.getUserByEmail(yandexInfo.default_email)
		const { resetPassLink } = genLinks(uuidV4)
		const newHashPass = await bcrypt.hash(this.defaultUserPass, 10)
		const accessHash = await bcrypt.hash(yandexToken.access_token, 10)
		let refreshHash: IAppEnCrypto | null = null

		const calcExpireIn = Date.now() + yandexToken.expires_in * 1000
		const newExpireIn = new Date(calcExpireIn)

		if (yandexToken.refresh_token) {
			refreshHash = encrypt(yandexToken.refresh_token)
		} else {
			refreshHash = null
		}

		const avatarUrl = `${yandexUserAvatarUrl}/${yandexInfo.default_avatar_id}/islands-middle`

		if (yandexInfo.default_email === user?.email) {
			const dataUpdateDto: IUserAccountDto & IUserWithoutAccountDto = {
				provider: 'yandex',
				types: 'openid-connect',
				accessToken: accessHash,
				expiresIn: newExpireIn,
				firstName: yandexInfo.first_name,
				email: yandexInfo.default_email,
				phone: '+993',
				password: user.password ?? newHashPass,
				picture: avatarUrl,
				isVerify: true,
				authMethod: AUTH_METHOD.YANDEX,
			}

			const updateUserYandex = await this.updateOAuth(
				this.model,
				this.tokenService,
				resetPassLink,
				user,
				dataUpdateDto,
				state
			)

			if ('message' in updateUserYandex) return updateUserYandex

			return {
				...updateUserYandex,
			}
		} else {
			const refreshNewValue =
				typeof refreshHash?.encrypted === 'string'
					? refreshHash.encrypted
					: null

			const dataCreateYandexDto: IUserAccountDto & IUserWithoutAccountDto = {
				firstName: yandexInfo.first_name,
				email: yandexInfo.default_email,
				phone: '+993',
				password: newHashPass,
				picture: avatarUrl,
				isVerify: true,
				authMethod: AUTH_METHOD.YANDEX,
				provider: 'yandex',
				types: 'openid-connect',
				accessToken: accessHash,
				refreshToken: refreshNewValue,
				refreshIv: refreshHash?.iv ?? null,
				refreshTag: refreshHash?.tag ?? null,
				expiresIn: newExpireIn,
			}

			const newUserYandex = await this.createOAuth(
				this.model,
				this.tokenService,
				dataCreateYandexDto,
				resetPassLink,
				AUTH_METHOD.YANDEX,
				state,
				refreshHash
			)

			if ('message' in newUserYandex) return newUserYandex

			return {
				...newUserYandex,
			}
		}
	}

	public async yandexRefresh(
		token: string
	): Promise<TypeUserOAuthRefresh | ApiError> {
		const now = new Date()
		const isVerifyToken = await this.tokenService.verifyToken(token)

		if (isVerifyTokenError(isVerifyToken))
			return ApiError.BadRequest(isVerifyToken.message)

		if (!isVerifyToken.sub || typeof isVerifyToken.role === 'undefined')
			return ApiError.BadRequest('ID or Role is not have from verify token')

		const userAccount = await this.model.findUserAccount(isVerifyToken.sub)

		if (
			!userAccount ||
			!userAccount.refresh_token_iv ||
			!userAccount.refresh_token_tag
		)
			return ApiError.NotFound('Not founded user data!')

		const decryptToken = decrypt(
			userAccount.refresh_token,
			userAccount.refresh_token_iv,
			userAccount.refresh_token_tag
		)

		const isTimeCheck =
			userAccount.expires_in &&
			now.getTime() >= userAccount.expires_in?.getTime()

		if (
			!decryptToken ||
			!this.clientGrantTypeRefresh ||
			!this.yandexClientID ||
			!this.yandexClientSecret
		)
			return ApiError.InternalServer('Error not set body data!')

		const dataBody = new URLSearchParams({
			grant_type: this.clientGrantTypeRefresh,
			refresh_token: decryptToken,
			client_id: this.yandexClientID,
			client_secret: this.yandexClientSecret,
		})

		const headersData = {
			'Content-Type': 'application/x-www-form-urlencoded',
		}

		if (isTimeCheck) {
			const responseYandexTokenData = await postOAuth(
				`${yandexOAuthToken}/token`,
				'POST',
				headersData,
				false,
				dataBody
			)
			let yandexToken: undefined | IResponseYandexTokenApi

			if (
				typeof responseYandexTokenData === 'object' &&
				responseYandexTokenData !== null &&
				'message' in responseYandexTokenData &&
				typeof responseYandexTokenData.message === 'string' &&
				'status' in responseYandexTokenData &&
				typeof responseYandexTokenData.status === 'number'
			) {
				return ApiError.BadRequest(
					responseYandexTokenData.message,
					responseYandexTokenData.status
				)
			}

			if (isResponseErrorDataApi(responseYandexTokenData)) {
				return ApiError.BadRequest(
					responseYandexTokenData.error_description ||
						responseYandexTokenData.error
				)
			}

			if (isResponseYandexTokenApi(responseYandexTokenData)) {
				yandexToken = responseYandexTokenData
			}

			if (yandexToken === null || typeof yandexToken === 'undefined') {
				return ApiError.BadRequest(
					'Error response from yandex code is have null!'
				)
			}

			const calcExpireIn = Date.now() + yandexToken.expires_in * 1000
			const newGoogleExpireIn = new Date(calcExpireIn)
			const accessHash = await bcrypt.hash(yandexToken.access_token, 10)

			const newTokenAccount = await this.model.updateTokens(
				userAccount.user_id,
				accessHash,
				token,
				newGoogleExpireIn,
				yandexToken.token_type
			)

			if (!newTokenAccount)
				return ApiError.InternalServer('Error from update account tokens')

			const user = await this.authModel.getUserById(userAccount.user_id)

			if (!user) return ApiError.NotFound('User not founded!!!')

			const tokens = await this.tokenService.generateTokens({
				id: user.id,
				role: user.role,
			})

			if (
				!tokens.refresh ||
				typeof tokens.refresh !== 'string' ||
				typeof tokens.access !== 'string'
			)
				return ApiError.InternalServer('Error refresh-token is not generate')

			const expireRefreshTokenAt = this.isExpireUtil(
				this.maxAgeRefresh,
				this.expireRefreshJwtUnitCase
			)
			const newSession = await this.tokenService.saveToken(
				user.id,
				tokens.refresh,
				expireRefreshTokenAt
			)

			if (
				typeof newSession === 'object' &&
				newSession !== null &&
				'message' in newSession
			)
				return ApiError.InternalServer(newSession.message)

			return {
				accessToken: tokens.access,
				refreshToken: tokens.refresh,
				expiresIn: expireRefreshTokenAt,
			}
		} else
			return ApiError.BadRequest('Yandex access-token is not expired!', 409)
	}
}
