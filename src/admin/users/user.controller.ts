import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger } from 'winston'
import { BaseConfig } from '../../common/abstract/base-config.common'
import type { IAppQueryParams } from '../../common/types/app/app.type'
import type { IContextFiles } from '../../common/types/middlewares/app.types-middleware'
import { responseInternalServer } from '../../common/utils/app/errorResponse.utils'
import type { AdminUserEditDto } from './dto/edit.dto'
import type { UserService } from './user.service'

export class UserController extends BaseConfig {
	constructor(private service: UserService, private logger: Logger) {
		super()
	}

	async getAllUser(
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const page = Number(query.queryParams?.page) || 1
			const limit = Number(query.queryParams?.limit) || 10
			const offset = (page - 1) * limit
			const userServiceResult = await this.service.findAllUser(limit, offset)

			if ('message' in userServiceResult) {
				const errorJsonData = JSON.stringify({
					message: userServiceResult.message,
				})

				res.writeHead(
					userServiceResult.status ?? 500,
					this.headData.contentData
				)
				res.end(errorJsonData)

				return
			}

			const jsonData = JSON.stringify(userServiceResult)

			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from get all admin-users controller',
				this.logger
			)
		}
	}

	async getByIdUser(
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const userId = query.queryParams?.userId
			const resultFindUser = await this.service.findOneUser(userId)

			if ('message' in resultFindUser) {
				const errorJsonData = JSON.stringify({
					message: resultFindUser.message,
				})

				res.writeHead(resultFindUser.status ?? 500, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			const jsonData = JSON.stringify(resultFindUser)

			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from get-one admin-users controller',
				this.logger
			)
		}
	}

	async editUser(
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams,
		body: AdminUserEditDto,
		file: IContextFiles | undefined
	): Promise<void> {
		try {
			const userId = query.queryParams?.userId

			const resultUpdateUser = await this.service.updateUser(
				userId,
				this.mode,
				body,
				file
			)

			if ('status' in resultUpdateUser) {
				const errorJsonData = JSON.stringify({
					message: resultUpdateUser.message,
				})

				res.writeHead(resultUpdateUser.status ?? 500, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			const jsonData = JSON.stringify(resultUpdateUser)

			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from update admin-user controller',
				this.logger
			)
		}
	}

	async deleteUser(
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const userId = query.queryParams?.userId
			const resultRemoveUser = await this.service.deleteUser(userId, this.mode)

			if ('status' in resultRemoveUser) {
				const errorJsonData = JSON.stringify({
					message: resultRemoveUser.message,
				})

				res.writeHead(resultRemoveUser.status ?? 500, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			const jsonData = JSON.stringify(resultRemoveUser)

			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
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
