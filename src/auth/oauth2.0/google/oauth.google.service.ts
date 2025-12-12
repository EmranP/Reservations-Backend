import { createRemoteJWKSet, jwtVerify } from 'jose'
import type { JwtPayload } from 'jsonwebtoken'
import type { Logger } from 'winston'
import { APP_OAUTH_CONFIG } from '../../../common/config/app.config'
import {
	googlePublicJwksUrl,
	googleUrl,
} from '../../../common/constants/auth.constant'
import { generateOAuthGoogleLink } from '../../../common/utils/app/generate.utils'
import { ApiError } from '../../../common/utils/log/exists-error.log'
import { UserGoogleDto } from '../../../user/dto/user.dto'
import type { ICommonGoogleBodyData } from '../../types/common.type'
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
	private googlePublicJwks = createRemoteJWKSet(new URL(googlePublicJwksUrl))

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
	): Promise<ApiError | JwtPayload> {
		if (!idToken) return ApiError.InternalServer('ID token is not have!')

		const account = await jwtVerify(idToken, this.googlePublicJwks, {
			algorithms: ['RSA256'],
			issuer: googleUrl,
		})

		if (!account || !account.payload)
			return ApiError.InternalServer('Bad-req from verify-account google')

		return account.payload
	}

	async googleCodeHandler(
		code: string
	): Promise<ApiError | IUserOAuthGoogle | null> {
		const commonData = await this.getCommonGoogleBodyData()

		if ('message' in commonData) return commonData

		const dataBody = {
			...commonData,
			code,
			grant_type: this.googleClientGrantTypeAuthCode,
		}

		const responseGoogleData = await getGoogleToken(dataBody)
		console.log(responseGoogleData)
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
			return null
		}
		// If we have token from db we update data

		const verifyGoogleAccount = await this.verifyGoogleToken(
			responseGoogleData.id_token
		)

		if ('message' in verifyGoogleAccount)
			return ApiError.InternalServer(verifyGoogleAccount.message)

		//? Add decrypt google profile data

		// ? Add checking email verify from google response

		//? Add handler where save db table account

		const userGoogle = new UserGoogleDto(responseGoogleData)

		return {
			user: userGoogle,
		}
	}

	async googleRefreshToken(refreshToken: string) {}
}
