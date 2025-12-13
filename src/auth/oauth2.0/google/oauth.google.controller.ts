import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger } from 'winston'
import {
	isErrorHandler,
	responseBadRequest,
} from '../../../common/utils/app/errorResponse.utils'
import { ApiError } from '../../../common/utils/log/exists-error.log'
import { AuthBaseConfig } from '../../abstract/auth-config.base'
import type { IOAuthGoogleCallback } from '../../dto/oauth.dto'
import type { OAuthGoogleService } from './oauth.google.service'

export class OAuthGoogleController extends AuthBaseConfig {
	constructor(private service: OAuthGoogleService, private logger: Logger) {
		super()
	}

	async googleUrl(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>
	): Promise<void> {
		try {
			const getLink = await this.service.getGoogleUrl()

			if (typeof getLink === 'string') {
				res.writeHead(302, {
					location: getLink,
				})
				res.end()

				return
			} else if (typeof getLink === 'object' && 'message' in getLink) {
				const errorJsonData = JSON.stringify({ message: getLink.message })
				res.writeHead(getLink.status, this.headData.contentData)
				res.end(errorJsonData)

				return
			}
		} catch (error) {
			const isError = isErrorHandler(
				error,
				'Bad-request from oAuth get google url'
			)
			const errorRes = ApiError.BadRequest(isError)
			this.logger.error(errorRes.message)

			await responseBadRequest(errorRes.message, res, 500)
		}
	}

	async googleCallback(
		req: IncomingMessage,
		res: ServerResponse,
		body: IOAuthGoogleCallback
	): Promise<void> {
		try {
			const userGoogle = await this.service.googleCodeHandler(body.code)

			if (
				typeof userGoogle === 'object' &&
				userGoogle !== null &&
				'message' in userGoogle
			) {
				const errorJsonData = JSON.stringify({ message: userGoogle.message })
				res.writeHead(userGoogle.status, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			const userDto = {
				user: { ...userGoogle.user },
				accessToken: userGoogle.accessToken,
			}
			const jsonData = JSON.stringify(userDto)

			if (!userGoogle.expiresIn) {
				const errorJsonData = JSON.stringify({
					message: 'Error expire-refresh token is not set',
				})

				res.writeHead(500, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			res.setHeader(
				'Set-cookie',
				`googleRefreshToken=${
					userGoogle?.refreshToken
				}; httpOnly; path=/api/auth/google/callback; Expires=${userGoogle.expiresIn.toUTCString()}; SameSite=Strict`
			)
			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			const isError = isErrorHandler(
				error,
				'Bad-request from oAuth google-callback'
			)
			const errorRes = ApiError.BadRequest(isError)
			this.logger.error(errorRes.message)

			await responseBadRequest(errorRes.message, res, 500)
		}
	}

	async googleRefreshToken(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		cookie: Record<string, string> | undefined
	) {}
}
