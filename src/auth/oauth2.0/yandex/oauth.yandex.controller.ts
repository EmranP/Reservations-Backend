import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger } from 'winston'
import { BaseConfig } from '../../../common/abstract/base-config.common'
import type { IAppQueryParams } from '../../../common/types/app/app.type'
import { responseInternalServer } from '../../../common/utils/app/errorResponse.utils'
import type { IOAuthCallback } from '../../dto/oauth.dto'
import type { OAuthYandexService } from './oauth.yandex.service'

export class OAuthYandexController extends BaseConfig {
	constructor(private service: OAuthYandexService, private logger: Logger) {
		super()
	}

	public async yandexUrl(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const state = query.queryParams?.state
			const getLink = await this.service.getYandexUrl(state)

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
				'Internal-server from oAuth get yandex-url',
				this.logger
			)
		}
	}

	public async yandexCallback(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		body: IOAuthCallback
	): Promise<void> {
		try {
			const userYandex = await this.service.yandexCodeHandler(
				body.code,
				body.state
			)

			if (
				typeof userYandex === 'object' &&
				userYandex !== null &&
				'message' in userYandex
			) {
				const errorJsonData = JSON.stringify({ message: userYandex.message })
				res.writeHead(userYandex.status, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			const userDto = {
				user: { ...userYandex.user },
				accessToken: userYandex.accessToken,
			}
			const jsonData = JSON.stringify(userDto)

			res.setHeader(
				'Set-cookie',
				`yandexRefreshToken=${
					userYandex.refreshToken
				}; httpOnly; path=/api; Expires=${userYandex.expiresIn.toUTCString()}; SameSite=Strict`
			)
			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from oAuth yandex-callback',
				this.logger
			)
		}
	}

	public async refreshToken(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		cookies: Record<string, string> | undefined
	): Promise<void> {
		try {
			if (!cookies || !cookies.yandexRefreshToken) {
				const error = JSON.stringify({
					message: 'Bad-request Cookie is not have',
				})

				res.writeHead(400, this.headData.contentData)
				res.end(error)

				return
			}

			const { yandexRefreshToken } = cookies

			const newRefresh = await this.service.yandexRefresh(yandexRefreshToken)

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
				`yandexRefreshToken=${
					newRefresh?.refreshToken
				}; httpOnly; path=/api; Expires=${newRefresh.expiresIn.toUTCString()}; SameSite=Strict`
			)
			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from update refresh-token oAuth yandex',
				this.logger
			)
		}
	}
}
