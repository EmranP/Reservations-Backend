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
			const googleCode = await this.service.googleCodeHandler(body.code)

			if (
				typeof googleCode === 'object' &&
				googleCode !== null &&
				'message' in googleCode
			) {
				const errorJsonData = JSON.stringify({ message: googleCode.message })
				res.writeHead(googleCode.status, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			const jsonData = JSON.stringify(
				googleCode?.user ? googleCode : { message: null }
			)

			// Add cookie for refreshToken
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
