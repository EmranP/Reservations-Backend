import fs from 'fs/promises'
import sharp from 'sharp'
import type { Logger } from 'winston'
import { AuthBaseConfig } from '../auth/abstract/auth-config.base'
import type { IAppMessage } from '../common/types/app/app.type'
import type { IContextFiles } from '../common/types/middlewares/app.types-middleware'
import { assetsPath } from '../common/utils/format/path.util'
import { ApiError } from '../common/utils/log/exists-error.log'
import type { AdminModel } from './admin.model'
import type { RoomDto } from './dto/room.dto'
import type { IGetAllRoomsWithMeta } from './types/admin.interface'

export class AdminService extends AuthBaseConfig {
	constructor(private model: AdminModel, private logger: Logger) {
		super()
	}

	async uploadImage(
		roomId: string | undefined,
		imagePath: string,
		isDev: string | undefined,
		fileBody: IContextFiles
	): Promise<IAppMessage | ApiError> {
		if (!roomId) return ApiError.NotFound('Room ID not founded!')

		if (
			fileBody.fileBufferData === null ||
			typeof fileBody.fileBufferData === 'undefined'
		)
			return ApiError.BadRequest('file-buffer data is not founded!')

		if (isDev === this.devMode) {
			try {
				const { format, size, width, height } = await sharp(
					fileBody.fileBufferData
				).metadata()

				const isValid = this.validateImageFile(size, format, width, height)

				if (typeof isValid === 'object' && 'message' in isValid)
					return ApiError.BadRequest(isValid.message)

				const imageData = await sharp(fileBody.fileBufferData)
					.resize(512, 512, { fit: 'cover', position: 'center' })
					.webp({ quality: 85 })
					.toFile(assetsPath(__dirname, imagePath))

				if (!imageData)
					return ApiError.InternalServer('The file was not compressed!')
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'File is not success upload!'

				return ApiError.BadRequest(errorMessage)
			}
		} else {
			// Add s3 storage
		}

		const messageSuccess = `Room image is success upload: ID-${roomId}`

		return {
			message: messageSuccess,
		}
	}

	async addRoom(
		roomId: string,
		imagePath: string,
		isDev: string | undefined,
		dto: RoomDto,
		file: IContextFiles
	): Promise<IAppMessage | ApiError> {
		try {
			await fs.access(imagePath)

			this.logger.warn('File is already have')
		} catch (error) {
			const resultUploadImage = await this.uploadImage(
				roomId,
				imagePath,
				isDev,
				file
			)

			if ('status' in resultUploadImage) return resultUploadImage
		}

		const newRoom = await this.model.createRoom(roomId, dto, imagePath)

		if (!newRoom)
			return ApiError.InternalServer('Error from add new room to database!')

		// Add get all room for save they to redis

		return { message: `The room have success added: ID-${newRoom.id}` }
	}

	async findAllRoom(
		limit: number = 10,
		offset: number = 0
	): Promise<IGetAllRoomsWithMeta | ApiError> {
		const allRooms = await this.model.getAllRooms(limit, offset)
		const total = await this.model.getRoomsCount()

		if (!allRooms?.length) return ApiError.NotFound('Rooms not founded!')

		if (!total) return ApiError.NotFound('Total count rooms not founded!')

		return {
			data: allRooms,
			meta: {
				total,
				limit,
				offset,
			},
		}
	}
}
