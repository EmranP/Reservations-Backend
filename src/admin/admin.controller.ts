import type { IncomingMessage, ServerResponse } from 'http'
import { v4 as uuid } from 'uuid'
import type { Logger } from 'winston'
import { BaseConfig } from '../common/abstract/base-config.common'
import type { IAppQueryParams } from '../common/types/app/app.type'
import type { IContextFiles } from '../common/types/middlewares/app.types-middleware'
import {
	responseBadRequest,
	responseInternalServer,
} from '../common/utils/app/errorResponse.utils'
import type { AdminService } from './admin.service'
import type { RoomDto } from './dto/room.dto'

export class AdminController extends BaseConfig {
	constructor(private service: AdminService, private logger: Logger) {
		super()
	}

	async createRoom(
		res: ServerResponse<IncomingMessage>,
		body: RoomDto,
		file: IContextFiles
	): Promise<void> {
		try {
			const roomId = uuid()
			const isDev = this.mode

			const resultAddedRoom = await this.service.addRoom(
				roomId,
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

	async getOneRoom(
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const roomId = query.queryParams?.roomId
			const room = await this.service.findOneRoom(roomId)

			if ('message' in room) {
				const errorJsonData = JSON.stringify({
					message: room.message,
				})

				res.writeHead(room.status ?? 500, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			const jsonData = JSON.stringify(room)

			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from get-by id room!',
				this.logger
			)
		}
	}

	async editRoom(
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams,
		body: RoomDto,
		file: IContextFiles | undefined
	): Promise<void> {
		try {
			const roomId = query.queryParams?.roomId
			const resultUpdateRoom = await this.service.updateRoom(
				roomId,
				this.mode,
				body,
				file
			)

			if ('status' in resultUpdateRoom) {
				const errorJsonData = JSON.stringify({
					message: resultUpdateRoom.message,
				})

				res.writeHead(resultUpdateRoom.status ?? 500, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			const jsonData = JSON.stringify(resultUpdateRoom)

			res.writeHead(201, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from edit room!',
				this.logger
			)
		}
	}

	async removeImageRoom(
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const roomId = query.queryParams?.roomId
			const isDev = this.mode
			const resultUploadImageRoom = await this.service.deleteImageRoom(
				roomId,
				null,
				isDev
			)

			if ('status' in resultUploadImageRoom) {
				const errorJsonData = JSON.stringify({
					message: resultUploadImageRoom.message,
				})

				res.writeHead(
					resultUploadImageRoom.status ?? 500,
					this.headData.contentData
				)
				res.end(errorJsonData)

				return
			}

			const jsonData = JSON.stringify(resultUploadImageRoom)

			res.writeHead(201, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server update-image room!',
				this.logger
			)
		}
	}

	async deleteRoom(
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const roomId = query.queryParams?.roomId
			const isDevMode = this.mode
			const resultDeleteRoom = await this.service.removeRoom(roomId, isDevMode)

			if ('status' in resultDeleteRoom) {
				const errorJsonData = JSON.stringify({
					message: resultDeleteRoom.message,
				})

				res.writeHead(resultDeleteRoom.status ?? 500, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			const jsonData = JSON.stringify(resultDeleteRoom)

			res.writeHead(201, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server delete room!',
				this.logger
			)
		}
	}
}
