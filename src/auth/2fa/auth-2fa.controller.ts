import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger } from 'winston'
import { BaseConfig } from '../../common/abstract/base-config.common'
import { responseInternalServer } from '../../common/utils/app/errorResponse.utils'
import type {
	EnableTwoFactoryChallenge,
	VerifyTwoFactoryAuthDto,
} from '../dto/2fa.dto'

import type { EmailService } from '../mail/email.service'
import type { IRequestUserApp } from '../types/token.type'
import type { AuthTwoFactoryChallengeService } from './auth-2fa.service'

export class AuthTwoFactoryController extends BaseConfig {
	constructor(
		protected authTwoFactoryService: AuthTwoFactoryChallengeService,
		protected authEmailService: EmailService,
		protected logger: Logger
	) {
		super()
	}

	async editEnableTwoFactory(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		dto: EnableTwoFactoryChallenge
	): Promise<void> {
		try {
			const userId = req.user?.sub

			if (!userId) {
				const errorJsonDataUserId = JSON.stringify({
					message: 'User id not founded!',
				})

				res.writeHead(400, this.headData.contentData)
				res.end(errorJsonDataUserId)

				return
			}

			const userEnableTwoFactory =
				await this.authTwoFactoryService.enableTwoFactory(userId, dto)

			if (typeof userEnableTwoFactory !== 'boolean') {
				const errorJsonData = JSON.stringify({
					message: userEnableTwoFactory.message,
				})

				res.writeHead(userEnableTwoFactory.status, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			const jsonData = JSON.stringify({
				message: userEnableTwoFactory
					? 'User has success enable 2FA'
					: 'User has success disable 2FA',
			})

			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from new-password controller',
				this.logger
			)
		}
	}

	async verifyCode(
		res: ServerResponse<IncomingMessage>,
		dto: VerifyTwoFactoryAuthDto
	) {
		try {
			const user = await this.authTwoFactoryService.verifyTwoFactoryCode(dto)

			if ('message' in user && user.status && user.status >= 400) {
				const errorData = JSON.stringify({ message: user.message })

				res.writeHead(user.status ?? 500, this.headData.contentData)
				res.end(errorData)

				return
			}

			if (!user.expireRefreshTokenAt) {
				const errorData = JSON.stringify({
					message: 'Expire refresh token is not set',
				})

				res.writeHead(user.status ?? 500, this.headData.contentData)
				res.end(errorData)

				return
			}

			const userDto = {
				user: { ...user?.user },
				accessToken: user?.accessToken,
			}
			const jsonData = JSON.stringify(userDto)

			res.setHeader(
				'Set-cookie',
				`refreshToken=${
					user?.refreshToken
				}; httpOnly; path=/api; Expires=${user.expireRefreshTokenAt.toUTCString()}; SameSite=Strict`
			)
			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from 2FA verify-code controller',
				this.logger
			)
		}
	}
}
