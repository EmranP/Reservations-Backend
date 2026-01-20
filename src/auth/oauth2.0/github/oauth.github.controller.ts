import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger } from 'winston'
import { BaseConfig } from '../../../common/abstract/auth-config.base'
import type { IAppQueryParams } from '../../../common/types/app/app.type'
import { responseInternalServer } from '../../../common/utils/app/errorResponse.utils'
import type { IOAuthCallback } from '../../dto/oauth.dto'
import type { OAuthGithubService } from './oauth.github.service'

export class OAuthGithubController extends BaseConfig {
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
			await responseInternalServer(
				error,
				res,
				'Internal-server from oAuth get github-url',
				this.logger
			)
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
			await responseInternalServer(
				error,
				res,
				'Internal-server from oAuth github-callback',
				this.logger
			)
		}
	}
}
