import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger } from 'winston'
import { BaseConfig } from '../../../common/abstract/base-config.common'
import type { IAppQueryParams } from '../../../common/types/app/app.type'
import { responseInternalServer } from '../../../common/utils/app/errorResponse.utils'
import type { IOAuthCallback } from '../../dto/oauth.dto'
import type { OAuthGoogleService } from './oauth.google.service'

export class OAuthGoogleController extends BaseConfig {
	constructor(private service: OAuthGoogleService, private logger: Logger) {
		super()
	}

	async googleUrl(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const state = query.queryParams?.state
			const getLink = await this.service.getGoogleUrl(state)

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
			await responseInternalServer(
				error,
				res,
				'Internal-server from oAuth get google-url',
				this.logger
			)
		}
	}

	async googleCallback(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		body: IOAuthCallback
	): Promise<void> {
		try {
			const userGoogle = await this.service.googleCodeHandler(
				body.code,
				body.state
			)

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

			res.setHeader(
				'Set-cookie',
				`googleRefreshToken=${
					userGoogle.refreshToken
				}; httpOnly; path=/api; Expires=${userGoogle.expiresIn.toUTCString()}; SameSite=Strict`
			)
			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from oAuth google-callback',
				this.logger
			)
		}
	}

	async refreshToken(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		cookies: Record<string, string> | undefined
	) {
		try {
			if (!cookies || !cookies.googleRefreshToken) {
				const error = JSON.stringify({
					message: 'Bad-request Cookie is not have',
				})

				res.writeHead(400, this.headData.contentData)
				res.end(error)

				return
			}

			const { googleRefreshToken } = cookies

			const newRefresh = await this.service.googleRefreshToken(
				googleRefreshToken
			)

			if ('message' in newRefresh) {
				const errorData = JSON.stringify({ message: newRefresh.message })

				res.writeHead(newRefresh.status ?? 500, this.headData.contentData)
				res.end(errorData)

				return
			}

			if (!newRefresh.expiresIn) {
				const errorJsonData = JSON.stringify({
					message: 'Error expire-refresh token is not set',
				})

				res.writeHead(500, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			const jsonData = JSON.stringify({ accessToken: newRefresh.accessToken })

			res.setHeader(
				'Set-cookie',
				`googleRefreshToken=${
					newRefresh?.refreshToken
				}; httpOnly; path=/api; Expires=${newRefresh.expiresIn.toUTCString()}; SameSite=Strict`
			)
			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server update refresh token from google',
				this.logger
			)
		}
	}
}
