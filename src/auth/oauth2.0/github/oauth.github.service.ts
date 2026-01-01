import bcrypt from 'bcrypt'
import { v4 as uuidV4 } from 'uuid'
import type { Logger } from 'winston'
import { APP_OAUTH_GITHUB_CONFIG } from '../../../common/config/app.config'
import {
	githubApiUrl,
	githubOAuthToken,
} from '../../../common/constants/auth.constant'
import { AUTH_METHOD } from '../../../common/constants/enum.constant'
import { genLinks } from '../../../common/constants/link.constant'
import type { IErrorResponseApp } from '../../../common/types/db/app.interface'
import { setDateUtil } from '../../../common/utils/app/date.util'
import { generateOAuthGithubLink } from '../../../common/utils/app/generate.utils'
import { ApiError } from '../../../common/utils/log/exists-error.log'
import { UserDto } from '../../../user/dto/user.dto'
import type { AuthModel } from '../../auth.model'
import type {
	IUserAccountDto,
	IUserWithoutAccountDto,
} from '../../dto/oauth.dto'
import {
	isResponseGithubEmailsApi,
	isResponseGithubTokenApi,
	isResponseGithubUserApi,
} from '../../pipe/oauth.pipe'
import type { TokenService } from '../../token/token.service'
import type {
	IGithubTokenResponse,
	IGithubUserEmailResponse,
	IGithubUserResponse,
} from '../../types/api.types'
import type { ICommonOAuthBodyData } from '../../types/common.type'
import type { IUserOAuth } from '../../types/types.auth'
import { getOAuth, postOAuth } from '../oauth.api'
import type { OAuthModel } from '../oauth.model'
import { OAuthService } from '../oauth.service'
export class OAuthGithubService extends OAuthService {
	constructor(
		private model: OAuthModel,
		private service: OAuthService,
		private authMode: AuthModel,
		private tokenService: TokenService,
		private logger: Logger
	) {
		super()
	}

	private githubClientId = APP_OAUTH_GITHUB_CONFIG.GITHUB_CLIENT_ID
	private githubClientSecret = APP_OAUTH_GITHUB_CONFIG.GITHUB_CLIENT_SECRET
	private githubClientRedirect = APP_OAUTH_GITHUB_CONFIG.GITHUB_CLIENT_REDIRECT

	async getGithubUrl(state: string | undefined): Promise<ApiError | string> {
		return await this.service.getOauthUrl(
			state,
			this.githubClientId,
			this.githubClientSecret,
			this.githubClientRedirect,
			() =>
				generateOAuthGithubLink(
					this.githubClientId,
					this.githubClientRedirect,
					state
				)
		)
	}

	async getCommonGithubBodyData(): Promise<ApiError | ICommonOAuthBodyData> {
		if (
			!this.githubClientId ||
			!this.githubClientRedirect ||
			!this.githubClientSecret
		)
			return ApiError.InternalServer(
				'Github oauth config is not set from common body data!'
			)

		const commonData: ICommonOAuthBodyData = {
			client_id: this.githubClientId,
			client_secret: this.githubClientSecret,
			redirect_uri: this.githubClientRedirect,
		}

		return commonData
	}

	async githubCodeHandler(
		code: string,
		state: string
	): Promise<ApiError | IUserOAuth> {
		if (!this.defaultUserPass)
			return ApiError.InternalServer(
				'App-config is not set default-pass for user'
			)

		const commonData = await this.getCommonGithubBodyData()

		if ('message' in commonData) return commonData

		const dataBody = {
			...commonData,
			code,
			state,
		}
		const headerData = {
			Accept: 'application/json',
		}

		const responseGithubTokenData = await postOAuth(
			githubOAuthToken,
			'POST',
			headerData,
			false,
			dataBody
		)
		let githubTokenData: undefined | IErrorResponseApp | IGithubTokenResponse

		if (isResponseGithubTokenApi(responseGithubTokenData)) {
			githubTokenData = responseGithubTokenData
		}

		if (
			githubTokenData !== null &&
			typeof githubTokenData === 'object' &&
			'message' in githubTokenData
		)
			return ApiError.BadRequest(
				githubTokenData.message,
				githubTokenData.status
			)

		if (githubTokenData === null || typeof githubTokenData === 'undefined')
			return ApiError.BadRequest(
				'Error response from github token is have null!'
			)

		const headerAuthData = {
			Authorization: `Bearer ${githubTokenData.access_token}`,
		}

		const responseGithubUserData = await getOAuth(
			`${githubApiUrl}/user`,
			'GET',
			headerAuthData
		)
		let githubUser: undefined | IGithubUserResponse | IErrorResponseApp

		if (isResponseGithubUserApi(responseGithubUserData)) {
			githubUser = responseGithubUserData
		}

		if (
			githubUser !== null &&
			typeof githubUser === 'object' &&
			'message' in githubUser
		)
			return ApiError.BadRequest(githubUser.message, githubUser.status)

		if (githubUser === null || typeof githubUser === 'undefined')
			return ApiError.BadRequest(
				'Error response from github user is have null!'
			)

		const headersEmailData = {
			Authorization: `Bearer ${githubTokenData.access_token}`,
			Accept: 'application/vnd.github+json',
		}

		const responseGithubUserEmails = await postOAuth(
			`${githubApiUrl}/user/emails`,
			'GET',
			headersEmailData
		)
		let githubUserEmailData:
			| undefined
			| IGithubUserEmailResponse[]
			| IErrorResponseApp

		if (isResponseGithubEmailsApi(responseGithubUserEmails)) {
			githubUserEmailData = responseGithubUserEmails
		}

		if (
			githubUserEmailData !== null &&
			typeof githubUserEmailData === 'object' &&
			'message' in githubUserEmailData
		)
			return ApiError.BadRequest(
				githubUserEmailData.message,
				githubUserEmailData.status
			)

		if (
			githubUserEmailData === null ||
			typeof githubUserEmailData === 'undefined'
		) {
			return ApiError.BadRequest(
				'Error response from github email is have null!'
			)
		}

		const userPrimaryGithubEmail = githubUserEmailData.find(
			item => item.primary === true
		)

		if (!userPrimaryGithubEmail)
			return ApiError.BadRequest('User not have primary github email')

		const user = await this.authMode.getUserByEmail(
			userPrimaryGithubEmail.email
		)
		const { resetPassLink } = genLinks(uuidV4)
		const newHashPass = await bcrypt.hash(this.defaultUserPass, 10)
		const accessHash = await bcrypt.hash(githubTokenData.access_token, 10)
		const expireTokensAt = setDateUtil(this.maxAgeRefresh)

		if (user?.email === userPrimaryGithubEmail.email) {
			if (!userPrimaryGithubEmail.verified)
				return ApiError.BadRequest(
					'User is not verify github email please verified him!',
					409
				)

			const dataUpdateDto: IUserAccountDto & IUserWithoutAccountDto = {
				provider: 'github',
				types: 'openid-connect',
				accessToken: accessHash,
				refreshIv: accessHash,
				expiresIn: expireTokensAt,
				firstName: githubUser.name,
				email: userPrimaryGithubEmail.email,
				phone: '+993',
				password: user.password ?? newHashPass,
				picture: githubUser.avatar_url,
				isVerify: userPrimaryGithubEmail.verified,
				authMethod: AUTH_METHOD.GITHUB,
			}

			const updateUserGithub = await this.model.updateUserOAuth(
				user.id,
				resetPassLink,
				dataUpdateDto
			)

			if (!updateUserGithub?.id || !updateUserGithub)
				return ApiError.InternalServer('Error from update account and user!')

			const userGithub = new UserDto(updateUserGithub)

			if (!userGithub.id || !userGithub.role)
				return ApiError.InternalServer('Error transform user-github dto')

			const tokens = await this.tokenService.generateTokens({
				id: userGithub.id,
				role: userGithub.role,
			})

			if (
				!tokens.refresh ||
				typeof tokens.refresh !== 'string' ||
				typeof tokens.access !== 'string'
			)
				return ApiError.InternalServer('Error refresh-token is not generate')

			const newSession = await this.tokenService.saveToken(
				userGithub.id,
				tokens.refresh,
				expireTokensAt,
				state
			)

			if (
				typeof newSession === 'object' &&
				newSession !== null &&
				'message' in newSession
			)
				return ApiError.InternalServer(newSession.message)

			return {
				user: userGithub,
				accessToken: tokens.access,
				refreshToken: tokens.refresh,
				expiresIn: expireTokensAt,
			}
		} else {
			if (!userPrimaryGithubEmail.verified)
				return ApiError.BadRequest(
					'User is not verify github email please verified him!',
					409
				)

			const dataCreateGithubDto: IUserAccountDto & IUserWithoutAccountDto = {
				firstName: githubUser.name,
				email: userPrimaryGithubEmail.email,
				phone: '+993',
				password: newHashPass,
				picture: githubUser.avatar_url,
				isVerify: userPrimaryGithubEmail.verified,
				authMethod: AUTH_METHOD.GITHUB,
				provider: 'github',
				types: 'openid-connect',
				accessToken: accessHash,
				refreshToken: accessHash,
				refreshIv: null,
				refreshTag: null,
				expiresIn: expireTokensAt,
			}

			const newUserGithub = await this.model.createUserOAuth(
				resetPassLink,
				AUTH_METHOD.GITHUB,
				dataCreateGithubDto
			)

			if (!newUserGithub)
				return ApiError.InternalServer(
					'Error from create user-account with github'
				)

			const userGithub = new UserDto(newUserGithub)

			if (!userGithub.id || typeof userGithub.role === 'undefined')
				return ApiError.BadRequest('User google dto not found!')

			const tokens = await this.tokenService.generateTokens({
				id: userGithub.id,
				role: userGithub.role,
			})

			if (
				!tokens.refresh ||
				typeof tokens.refresh !== 'string' ||
				typeof tokens.access !== 'string'
			)
				return ApiError.InternalServer('Error refresh-token is not generate')

			const newSession = await this.tokenService.saveToken(
				userGithub.id,
				tokens.refresh,
				expireTokensAt,
				state
			)

			if (
				typeof newSession === 'object' &&
				newSession !== null &&
				'message' in newSession
			)
				return ApiError.InternalServer(newSession.message)

			return {
				user: userGithub,
				accessToken: tokens.access,
				refreshToken: tokens.refresh,
				expiresIn: expireTokensAt,
			}
		}
	}
}
