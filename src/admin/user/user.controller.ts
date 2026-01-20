import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger } from 'winston'
import { responseInternalServer } from '../../common/utils/app/errorResponse.utils'
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
			await responseInternalServer(
				error,
				res,
				'Internal-server from get all users controller',
				this.logger
			)
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
			await responseInternalServer(
				error,
				res,
				'Internal-server from delete user controller',
				this.logger
			)
		}
	}
}
