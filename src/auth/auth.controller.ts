import type { IncomingMessage, ServerResponse } from 'http'

import type { Logger } from 'winston'
import { responseBadRequest } from '../common/utils/app/errorResponse.utils'
import { ApiError } from '../common/utils/log/exists-error.log'
import { AuthService } from './auth.service'
import type { LoginDto } from './dto/login.dto'
import type { RegistrationDto } from './dto/registration.dto'
import type { IAuthUserService } from './types/types.auth'

export class AuthController {
	constructor(private authService: AuthService, private logger: Logger) {}

	async login(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		body: LoginDto
	): Promise<void> {
		try {
			let user: Partial<IAuthUserService> | undefined

			if (body.email) {
				user = await this.authService.loginEmail(body)
			} else if (body.phone) {
				user = await this.authService.loginPhone(body)
			}

			if (user && user.status && user.status >= 400) {
				const errorJsonData = JSON.stringify({ message: user.message })

				res.writeHead(user.status ?? 500, {
					'Content-Type': 'application/json',
				})
				res.end(errorJsonData)

				return
			}

			const jsonData = JSON.stringify(user)

			res.writeHead(200, { 'Content-Type': 'application/json' })
			res.end(jsonData)
		} catch (error) {
			if (error instanceof Error) {
				const errorRes = ApiError.BadRequest(error.message)

				this.logger.error(errorRes.message)
				await responseBadRequest(errorRes.message, res)
			} else {
				const errorRes = ApiError.BadRequest(
					'Bad-request from login controller'
				)

				await responseBadRequest(errorRes.message, res)
			}
		}
	}

	async registration(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		body: RegistrationDto
	): Promise<void> {
		try {
			const newUser = await this.authService.registration(body)

			if (newUser.message || (newUser.status && newUser.status >= 400)) {
				const errorData = JSON.stringify({ message: newUser.message })

				res.writeHead(newUser.status ?? 500, {
					'Content-Type': 'application/json',
				})
				res.end(errorData)

				return
			}

			const jsonData = JSON.stringify(newUser)

			res.writeHead(201, { 'Content-Type': 'application/json' })
			res.end(jsonData)
		} catch (error) {
			const errorRes = ApiError.BadRequest(
				'Bad-request from registration controller :('
			)

			this.logger.error(errorRes.message)

			await responseBadRequest(errorRes.message, res)
		}
	}

	async refresh(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {}

	async logout(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {}
}
