import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger } from 'winston'
import { responseBadRequest } from '../common/utils/app/errorResponse.utils'
import { ApiError } from '../common/utils/log/exists-error.log'
import type { UserService } from './user.service'

export class UserController {
	constructor(private userService: UserService, private logger: Logger) {}

	async getAllUser(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		body: unknown
	): Promise<void> {
		try {
			const userServiceResult = await this.userService.findAllUser()

			if (
				userServiceResult &&
				userServiceResult.status &&
				userServiceResult.status >= 400
			) {
				const errorJsonData = JSON.stringify({
					message: userServiceResult.message,
				})

				res.writeHead(userServiceResult.status ?? 500, {
					'Content-Type': 'application/json',
				})
				res.end(errorJsonData)

				return
			}

			const jsonData = JSON.stringify(userServiceResult.users)

			res.writeHead(200, {
				'Content-Type': 'application/json',
			})
			res.end(jsonData)
		} catch (error) {
			let errorRes: ApiError | undefined
			if (error instanceof Error) {
				errorRes = ApiError.BadRequest(error.message)

				this.logger.error(errorRes.message)
				await responseBadRequest(errorRes.message, res)
			} else {
				errorRes = ApiError.BadRequest(
					'Bad-request from get all users controller'
				)

				await responseBadRequest(errorRes.message, res)
			}
		}
	}

	async getByIdUser(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		body: unknown
	): Promise<void> {}

	async editUser(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		body: unknown
	): Promise<void> {}

	async deleteUser(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		body: unknown
	): Promise<void> {
		try {
			const userId = ''
			const removeUser = await this.userService.deleteUser(userId)
		} catch (error) {
			const errorRes = ApiError.BadRequest(
				'Bad-request from delete user controller'
			)

			this.logger.error(errorRes.message)

			await responseBadRequest(errorRes.message, res)
		}
	}
}
