import type { Logger } from 'winston'
import { APP_OAUTH_CONFIG } from '../../../common/config/app.config'
import { generateOAuthGoogleLink } from '../../../common/utils/app/generate.utils'
import { ApiError } from '../../../common/utils/log/exists-error.log'
import { UserGoogleDto } from '../../../user/dto/user.dto'
import type { IUserOAuthGoogle } from '../../types/types.auth'
import { getGoogleToken } from './oauth.google.api'
import type { OAuthGoogleModel } from './oauth.google.model'

export class OAuthGoogleService {
	constructor(private model: OAuthGoogleModel, private logger: Logger) {}

	private googleClientId = APP_OAUTH_CONFIG.GOOGLE_CLIENT_ID
	private googleClientSecret = APP_OAUTH_CONFIG.GOOGLE_CLIENT_SECRET
	private googleClientRedirect = APP_OAUTH_CONFIG.GOOGLE_CLIENT_REDIRECT
	private googleClientGrantTypeAuthCode = 'authorization_code'
	private googleClientGrantTypeRefresh = 'refresh_token'

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

	async googleCodeHandler(
		code: string
	): Promise<ApiError | IUserOAuthGoogle | null> {
		if (
			!this.googleClientId ||
			!this.googleClientSecret ||
			!this.googleClientRedirect
		)
			return ApiError.InternalServer('Google oauth config not set!')

		const commonData = {
			client_id: this.googleClientId,
			client_secret: this.googleClientSecret,
			redirect_uri: this.googleClientRedirect,
		}
		// If we have token from db we update data
		const tokenDataBody = {
			...commonData,
			grant_type: this.googleClientGrantTypeRefresh,
		}

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

		// Add handler where save db table account

		if (responseGoogleData === null) {
			return null
		}

		const userGoogle = new UserGoogleDto(responseGoogleData)

		return {
			user: userGoogle,
		}
	}

	async googleRefreshToken(refreshToken: string) {}
}
