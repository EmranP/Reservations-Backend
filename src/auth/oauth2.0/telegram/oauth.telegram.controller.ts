import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger } from 'winston'
import { BaseConfig } from '../../../common/abstract/base-config.common'
import { responseInternalServer } from '../../../common/utils/app/errorResponse.utils'
import type { IOAuthTelegramCallbackDto } from '../../dto/oauth.dto'
import type { OAuthTelegramService } from './oauth.telegram.service'

export class OAuthTelegramController extends BaseConfig {
	constructor(private service: OAuthTelegramService, private logger: Logger) {
		super()
	}

	public async tgCallback(
		res: ServerResponse<IncomingMessage>,
		body: IOAuthTelegramCallbackDto
	): Promise<void> {
		try {
			const userTelegram = await this.service.tgCallback(
				body.user,
				body.email,
				body.state
			)

			if (
				typeof userTelegram === 'object' &&
				userTelegram !== null &&
				'message' in userTelegram
			) {
				const errorJsonData = JSON.stringify({ message: userTelegram.message })
				res.writeHead(userTelegram.status, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			const userDto = {
				user: { ...userTelegram.user },
				accessToken: userTelegram.accessToken,
			}
			const jsonData = JSON.stringify(userDto)

			res.setHeader(
				'Set-cookie',
				`telegramRefreshToken=${
					userTelegram.refreshToken
				}; httpOnly; path=/api; Expires=${userTelegram.expiresIn.toUTCString()}; SameSite=Strict`
			)
			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from oAuth telegram-callback',
				this.logger
			)
		}
	}

	public async tgRefresh(
		res: ServerResponse<IncomingMessage>,
		cookies: Record<string, string> | undefined
	): Promise<void> {
		try {
			if (!cookies || !cookies.telegramRefreshToken) {
				const error = JSON.stringify({
					message: 'Bad-request Cookie is not have',
				})

				res.writeHead(400, this.headData.contentData)
				res.end(error)

				return
			}

			const { telegramRefreshToken } = cookies

			const newRefresh = await this.service.refreshToken(telegramRefreshToken)

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
				`telegramRefreshToken=${
					newRefresh?.refreshToken
				}; httpOnly; path=/api; Expires=${newRefresh.expiresIn.toUTCString()}; SameSite=Strict`
			)
			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server update refresh token from telegram-controller',
				this.logger
			)
		}
	}
}
