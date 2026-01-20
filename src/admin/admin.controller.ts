import type { IncomingMessage, ServerResponse } from 'http'
import { v4 as uuid } from 'uuid'
import type { Logger } from 'winston'
import type { IRequestUserApp } from '../auth/types/token.type'
import { BaseConfig } from '../common/abstract/auth-config.base'
import type { IAppQueryParams } from '../common/types/app/app.type'
import type { IContextFiles } from '../common/types/middlewares/app.types-middleware'
import {
	responseBadRequest,
	responseInternalServer,
} from '../common/utils/app/errorResponse.utils'
import { assetsPath } from '../common/utils/format/path.util'
import type { AdminService } from './admin.service'
import type { RoomDto } from './dto/room.dto'

export class AdminController extends BaseConfig {
	constructor(private service: AdminService, private logger: Logger) {
		super()
	}

	async createRoom(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		body: RoomDto,
		file: IContextFiles
	): Promise<void> {
		try {
			const roomId = uuid()
			const roomImage = assetsPath(
				__dirname,
				`${this.pathAssets}/img/rooms/${roomId}.webp`
			)
			const isDev = this.mode

			const resultAddedRoom = await this.service.addRoom(
				roomId,
				roomImage,
				isDev,
				body,
				file
			)

			if ('status' in resultAddedRoom) {
				await responseBadRequest(
					resultAddedRoom.message,
					res,
					resultAddedRoom.status
				)

				return
			}

			const jsonData = JSON.stringify(resultAddedRoom)

			this.logger.info(resultAddedRoom.message)

			res.writeHead(201, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from add room!',
				this.logger
			)
		}
	}

	async getAllRoom(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	) {
		try {
			const page = Number(query.queryParams?.page) || 1
			const limit = Number(query.queryParams?.limit) || 10
			const offset = (page - 1) * limit

			const roomsResult = await this.service.findAllRoom(limit, offset)

			if ('message' in roomsResult) {
				const errorJsonData = JSON.stringify({
					message: roomsResult.message,
				})

				res.writeHead(roomsResult.status ?? 500, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			const jsonData = JSON.stringify(roomsResult)

			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from get all room!',
				this.logger
			)
		}
	}
}
