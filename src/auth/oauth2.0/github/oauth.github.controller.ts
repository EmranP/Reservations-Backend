import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger } from 'winston'
import type { IAppQueryParams } from '../../../common/types/app/app.type'
import {
	isErrorHandler,
	responseBadRequest,
} from '../../../common/utils/app/errorResponse.utils'
import { ApiError } from '../../../common/utils/log/exists-error.log'
import { AuthBaseConfig } from '../../abstract/auth-config.base'
import type { IOAuthCallback } from '../../dto/oauth.dto'
import type { OAuthGithubService } from './oauth.github.service'

export class OAuthGithubController extends AuthBaseConfig {
	constructor(private service: OAuthGithubService, private logger: Logger) {
		super()
	}

	async githubUrl(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const state = query.queryParams?.state
			const getLink = await this.service.getGithubUrl(state)

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
				'Bad-request from oAuth get github url'
			)
			const errorRes = ApiError.BadRequest(isError)
			this.logger.error(errorRes.message)

			await responseBadRequest(errorRes.message, res, 500)
		}
	}

	async githubCallback(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		body: IOAuthCallback
	): Promise<void> {
		try {
			const userGithub = await this.service.githubCodeHandler(
				body.code,
				body.state
			)

			if (
				typeof userGithub === 'object' &&
				userGithub !== null &&
				'message' in userGithub
			) {
				const errorJsonData = JSON.stringify({ message: userGithub.message })
				res.writeHead(userGithub.status, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			const userDto = {
				user: { ...userGithub.user },
				accessToken: userGithub.accessToken,
			}
			const jsonData = JSON.stringify(userDto)

			res.setHeader(
				'Set-cookie',
				`githubRefreshToken=${
					userGithub.refreshToken
				}; httpOnly; path=/api; Expires=${userGithub.expiresIn.toUTCString()}; SameSite=Strict`
			)
			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			const isError = isErrorHandler(
				error,
				'Bad-request from oAuth github-callback'
			)
			const errorRes = ApiError.BadRequest(isError)
			this.logger.error(errorRes.message)

			await responseBadRequest(errorRes.message, res, 500)
		}
	}
}
