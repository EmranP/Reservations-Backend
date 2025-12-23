import { createRemoteJWKSet } from 'jose'
import type { Logger } from 'winston'
import {
	APP_CONFIG,
	APP_OAUTH_GITHUB_CONFIG,
} from '../../../common/config/app.config'
import {
	githubOAuthToken,
	githubPublicJwksUrl,
} from '../../../common/constants/auth.constant'
import { generateOAuthGithubLink } from '../../../common/utils/app/generate.utils'
import { ApiError } from '../../../common/utils/log/exists-error.log'
import type { AuthModel } from '../../auth.model'
import type { TokenService } from '../../token/token.service'
import type { ICommonOAuthBodyData } from '../../types/common.type'
import { getOAuthToken } from '../oauth.api'
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
	private githubPublicJwks = createRemoteJWKSet(new URL(githubPublicJwksUrl))
	private defaultUserPass = APP_CONFIG.USER_DEFAULT_PASS

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

	async githubCodeHandler(code: string, state: string) {
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

		const responseGithubData = await getOAuthToken(
			githubOAuthToken,
			'POST',
			headerData,
			false,
			dataBody
		)

		console.log(responseGithubData)

		const headerAuthData = {
			Authorization: `Bearer ${responseGithubData.access_token}`,
		}

		const userData = await getOAuthToken(
			'https://api.github.com/user',
			'GET',
			headerAuthData
		)

		console.log(userData)

		let githubData: undefined

		// Add validate Data
	}
}
