import type { IncomingMessage, ServerResponse } from 'http'

import { responseBadRequest } from '../common/utils/app/errorResponse.utils'
import { writeHeadData } from '../common/utils/app/writeHeadData.utils'
import { ApiError } from '../common/utils/log/exists-error.log'
import { AuthService } from './auth.service'
import type { LoginDto } from './dto/login.dto'
import type { RegistrationDto } from './dto/registration.dto'

export class AuthController {
	constructor(private authService: AuthService) {}

	async login(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		body: LoginDto
	): Promise<void> {
		try {
			const headData = writeHeadData(200)
			const user = await this.authService.login(body)

			if (user.status === 404) {
				res.writeHead(user.status, headData.contentData)
			} else if (user.status === 400) {
				res.writeHead(user.status, headData.contentData)
			} else {
				res.writeHead(headData.status, headData.contentData)
			}

			const jsonData = JSON.stringify(user)
			res.end(jsonData)
		} catch (error) {
			if (error instanceof Error) {
				const errorRes = ApiError.BadRequest(error.message)

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
			res.writeHead(201, { 'Content-Type': 'application/json' })

			const data = { message: 'reg controller' }
			const jsonData = JSON.stringify(data)

			res.end(jsonData)
		} catch (error) {
			const errorRes = ApiError.BadRequest(
				'Bad-request from registration controller :('
			)

			await responseBadRequest(errorRes.message, res)
		}
	}

	async refresh(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {}

	async logout(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {}
}
