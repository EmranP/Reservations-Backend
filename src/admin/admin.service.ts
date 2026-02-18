import fs from 'fs/promises'
import type { Client } from 'minio'
import sharp from 'sharp'
import type { Logger } from 'winston'
import { roomsBucketName } from '../app/s3/init-cloud-storage.app'
import { BaseConfig } from '../common/abstract/base-config.common'
import { APP_REDIS_CONFIG } from '../common/config/app.config'
import { DB_TABLE_ROOMS } from '../common/constants/table-db.constant'
import { checkCacheRedisClient } from '../common/redis/utils/check-cache.util'
import {
	delHashRedisClient,
	getAllListRedisClient,
	getRedisClientHashKey,
	setHashRedisClientWithEx,
	setListRedisClientWIthEx,
} from '../common/redis/utils/grud-redis.util'
import type {
	IAppMessage,
	IGetAllDataWithMeta,
} from '../common/types/app/app.type'

import type { IRooms } from '../app/db/types/rooms.types'
import type { IContextFiles } from '../common/types/middlewares/app.types-middleware'
import { setDateUtil } from '../common/utils/app/date.util'
import { assetsPath } from '../common/utils/format/path.util'
import { ApiError } from '../common/utils/log/exists-error.log'
import type { AdminModel } from './admin.model'
import { RoomDto, type IRoomDto } from './dto/room.dto'

export class AdminService extends BaseConfig {
	constructor(
		private model: AdminModel,
		private clientS3: Client,
		private logger: Logger
	) {
		super()
	}

	private async uploadImage(
		roomId: string | undefined,
		isDev: string | undefined,
		fileBody: IContextFiles
	): Promise<string | ApiError> {
		if (!roomId) return ApiError.NotFound('Room ID not founded!')

		if (
			fileBody.fileBufferData === null ||
			typeof fileBody.fileBufferData === 'undefined'
		)
			return ApiError.BadRequest('file data is not founded!')

		const { format, size, width, height } = await sharp(
			fileBody.fileBufferData
		).metadata()

		const isValid = this.validateImageFile(
			size,
			format,
			width,
			height,
			this.logger
		)

		if (typeof isValid === 'object' && 'message' in isValid)
			return ApiError.BadRequest(isValid.message)

		let imagePath: string | undefined
		const filename = `${roomId}.${format}`

		if (isDev === this.devMode) {
			imagePath = assetsPath(
				__dirname,
				`${this.pathAssets}/img/rooms/${filename}`
			)
			try {
				const imageData = await sharp(fileBody.fileBufferData)
					.resize(512, 512, { fit: 'cover', position: 'center' })
					.webp({ quality: 85 })
					.toFile(imagePath)

				if (!imageData)
					return ApiError.InternalServer('The file was not compressed!')
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'File is not success upload!'

				return ApiError.BadRequest(errorMessage)
			}
		} else {
			try {
				await this.clientS3.putObject(
					roomsBucketName,
					filename,
					fileBody.fileBufferData,
					size
				)

				this.logger.info('Rooms-image success upload to s3-storage')

				const getProfileImageUrl = await this.clientS3.presignedGetObject(
					roomsBucketName,
					filename,
					this.expireS3Image,
					{
						'Content-Type': `image/${format}`,
						'response-content-disposition': 'inline',
					}
				)

				imagePath = getProfileImageUrl
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: 'File is not success upload to s3-storage!'

				return ApiError.BadRequest(errorMessage)
			}
		}

		this.logger.info(`Room image is success upload: ID-${roomId}`)

		return imagePath
	}

	async addRoom(
		roomId: string,
		isDev: string | undefined,
		dto: RoomDto,
		file: IContextFiles
	): Promise<IAppMessage | ApiError> {
		const resultUploadImage = await this.uploadImage(roomId, isDev, file)

		if (typeof resultUploadImage === 'object' && 'status' in resultUploadImage)
			return resultUploadImage

		const expireImageUrl = setDateUtil(7)
		const newRoom = await this.model.createRoom(
			roomId,
			dto,
			resultUploadImage,
			expireImageUrl
		)

		if (!newRoom)
			return ApiError.InternalServer('Error from add new room to database!')

		try {
			const allRooms = await this.model.getAllRooms(10, 0)

			if (allRooms) {
				const updateCacheListRoom = await setListRedisClientWIthEx(
					this.keysRooms,
					this.keysRoomsIds,
					allRooms
				)

				if (
					typeof updateCacheListRoom === 'object' &&
					'message' in updateCacheListRoom
				) {
					this.logger.warn('New data rooms is not success safe to cache')
				}
			}
		} catch (error) {
			this.logger.warn(`Update room is not success safe to cache: ID-${roomId}`)
		}

		return { message: `The room have success added: ID-${newRoom.id}` }
	}

	async findAllRoom(
		limit: number,
		limitCache: number,
		offset: number
	): Promise<IGetAllDataWithMeta<IRoomDto> | ApiError> {
		const getListRoomsCache = await getAllListRedisClient(
			this.keysRooms,
			this.keysRoomsIds,
			limitCache,
			offset
		)
		const allRooms = await checkCacheRedisClient(
			getListRoomsCache,
			() => this.model.getAllRooms(limit, offset),
			'Rooms success get from cache!',
			'Rooms success get from database!'
		)
		const total = await this.getModelCount(DB_TABLE_ROOMS, this.logger)

		if (!allRooms?.length || !total)
			return ApiError.NotFound('Rooms not founded!')

		const allRoomsDto = allRooms.map(room => new RoomDto(room).toPlain())

		if (!getListRoomsCache.length) {
			try {
				if (allRooms.length) {
					const updateCacheListRoom = await setListRedisClientWIthEx(
						this.keysRooms,
						this.keysRoomsIds,
						allRooms
					)

					if (
						typeof updateCacheListRoom === 'object' &&
						'message' in updateCacheListRoom
					) {
						this.logger.warn('New data rooms is not success safe to cache')
					}
				}
			} catch (error) {
				this.logger.warn(`Get-all room is not success safe to cache`)
			}
		}

		return {
			data: allRoomsDto,
			meta: {
				total,
				limit,
				offset,
			},
		}
	}

	async findOneRoom(roomId: string | undefined): Promise<IRoomDto | ApiError> {
		if (!roomId) return ApiError.NotFound('Room ID not fonded!')

		const getRoomByIdCache = await getRedisClientHashKey(
			this.keysRoomsIds,
			roomId
		)

		const getOneRoom = await checkCacheRedisClient(
			getRoomByIdCache,
			() => this.model.getRoomById(roomId),
			'Get room by id from cache!',
			'Get room by id from database!'
		)

		if (!getOneRoom) return ApiError.NotFound('Room not founded!')

		const now = new Date()
		let isUpdateRoom: IRooms | null = getOneRoom

		if (
			getOneRoom.expire_picture_url !== null &&
			now.getTime() >= new Date(getOneRoom.expire_picture_url).getTime()
		) {
			const expireRoomImageUrl = setDateUtil(7)
			const newRoomImageUrl = await this.clientS3.presignedGetObject(
				roomsBucketName,
				`${getOneRoom.id}.png`,
				this.expireS3Image,
				{
					'response-content-disposition': 'inline',
				}
			)

			isUpdateRoom = await this.model.updateRoomImage(
				getOneRoom.id,
				newRoomImageUrl,
				expireRoomImageUrl,
				'*'
			)

			if (!isUpdateRoom)
				return ApiError.BadRequest(
					'Bad-request room-image is not success update!'
				)

			const updateRoomCache = await setHashRedisClientWithEx(
				this.keysRoomsIds,
				isUpdateRoom.id,
				isUpdateRoom
			)

			if (typeof updateRoomCache === 'object' && 'message' in updateRoomCache) {
				this.logger.error(updateRoomCache.message)
			}
		}

		if (!getRoomByIdCache) {
			const addNewRoomById = await setHashRedisClientWithEx(
				this.keysRoomsIds,
				roomId,
				JSON.stringify(isUpdateRoom),
				APP_REDIS_CONFIG.ONE_DAY_EXPIRES_TIME_REDIS
			)

			if (typeof addNewRoomById === 'object' && 'status' in addNewRoomById) {
				this.logger.warn(addNewRoomById.message)
			}

			this.logger.info(`New room have success added to cache: ID-${roomId}`)
		}

		const roomDto = new RoomDto(isUpdateRoom)

		return roomDto
	}

	async updateRoom(
		roomId: string | undefined,
		isDev: string | undefined,
		dto: RoomDto,
		fileBody: IContextFiles | undefined
	): Promise<IAppMessage | ApiError> {
		if (!roomId) return ApiError.NotFound('Room-id not founded!')

		const getRoomByIdCache = await getRedisClientHashKey(
			this.keysRoomsIds,
			roomId
		)

		const getOneRoom = await checkCacheRedisClient(
			getRoomByIdCache,
			() => this.model.getRoomById(roomId),
			'Get room by id from cache!',
			'Get room by id from database!'
		)

		if (!getOneRoom) return ApiError.NotFound('Room not founded!')

		if (
			(fileBody?.fileBufferData && fileBody.fileBufferData === null) ||
			(fileBody?.fileBufferData &&
				typeof fileBody.fileBufferData === 'undefined')
		)
			return ApiError.BadRequest('file data is not founded!')

		let imagePath: string | ApiError | null = null

		if (fileBody?.fileBufferData) {
			imagePath = await this.uploadImage(roomId, isDev, fileBody)

			if (typeof imagePath === 'object' && 'status' in imagePath)
				return imagePath
		}

		const resultEditRoom = await this.model.editRoomById(
			getOneRoom.id,
			dto,
			imagePath
		)

		if (!resultEditRoom)
			return ApiError.InternalServer(
				`Error from edit-room: ID-${getOneRoom.id}`
			)

		try {
			const allRooms = await this.model.getAllRooms(10, 0)

			if (allRooms) {
				const updateCacheListRoom = await setListRedisClientWIthEx(
					this.keysRooms,
					this.keysRoomsIds,
					allRooms
				)

				if (
					typeof updateCacheListRoom === 'object' &&
					'message' in updateCacheListRoom
				) {
					this.logger.warn('New data rooms is not success safe to cache')
				}
			}
		} catch (error) {
			this.logger.warn(
				`Update room is not success safe to cache: ID-${getOneRoom.id}`
			)
		}

		return {
			message: `Room have success update: ID-${resultEditRoom.id}`,
		}
	}

	async deleteImageRoom(
		roomId: string | undefined,
		dto: null,
		isDev: string | undefined
	): Promise<IAppMessage | ApiError> {
		if (!roomId) return ApiError.NotFound('Room-id not founded!')

		const getOneRoomCache = await getRedisClientHashKey(
			this.keysRoomsIds,
			roomId
		)

		const getOneRoom = await checkCacheRedisClient(
			getOneRoomCache,
			() => this.model.getRoomById(roomId),
			'Get-one room from cache!',
			'Get-one room from database '
		)

		if (!getOneRoom) return ApiError.NotFound('Room is not founded!')

		const filename = `${roomId}.png`

		if (isDev === this.devMode) {
			const imagePath = assetsPath(
				__dirname,
				`../../assets/img/rooms/${filename}`
			)

			try {
				await fs.access(imagePath)

				await fs.unlink(imagePath)
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: 'File is not success delete: Dev-mode'

				return ApiError.BadRequest(errorMessage)
			}
		} else {
			try {
				await this.clientS3.removeObject(roomsBucketName, filename)

				this.logger.warn('Room-image success deleted from S3!')
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: 'Room-image is not success remove!: S3-storage'

				this.logger.error(errorMessage)

				return ApiError.BadRequest(errorMessage)
			}
		}

		const resultUploadImage = await this.model.updateRoomImage(
			roomId,
			dto,
			null,
			'id'
		)

		if (!resultUploadImage)
			return ApiError.InternalServer(
				`Error from update-image room: ID-${roomId}`
			)

		try {
			const allRooms = await this.model.getAllRooms(10, 0)

			if (allRooms) {
				const updateCacheListRoom = await setListRedisClientWIthEx(
					this.keysRooms,
					this.keysRoomsIds,
					allRooms
				)
				const updateCacheRoomIds = await setHashRedisClientWithEx(
					this.keysRoomsIds,
					getOneRoom.id,
					getOneRoom
				)

				if (
					(typeof updateCacheListRoom === 'object' &&
						'message' in updateCacheListRoom) ||
					(typeof updateCacheRoomIds === 'object' &&
						'message' in updateCacheRoomIds)
				) {
					this.logger.warn('Update data rooms to cache')
				}
			}
		} catch (error) {
			this.logger.warn(`Update room is not success safe to cache: ID-${roomId}`)
		}

		return {
			message: `Room have success update: ID-${resultUploadImage.id}`,
		}
	}

	async removeRoom(
		roomId: string | undefined,
		isDev: string | undefined
	): Promise<ApiError | IAppMessage> {
		if (!roomId) return ApiError.NotFound('Room-ID not founded!')

		const getOneRoomCache = await getRedisClientHashKey(
			this.keysRoomsIds,
			roomId
		)

		const getOneRoom = await checkCacheRedisClient(
			getOneRoomCache,
			() => this.model.getRoomById(roomId),
			'Get-one room from cache!',
			'Get-one room from database '
		)

		if (!getOneRoom) return ApiError.NotFound('Room is not founded!')

		const filename = `${roomId}.png`

		if (isDev === this.devMode) {
			const imagePath = assetsPath(
				__dirname,
				`../../assets/img/rooms/${filename}`
			)

			try {
				await fs.access(imagePath)

				await fs.unlink(imagePath)
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: 'File is not success delete: Dev-mode'

				this.logger.error(errorMessage)
			}
		} else {
			try {
				await this.clientS3.removeObject(roomsBucketName, filename)

				this.logger.warn('Room-image success deleted from S3!')
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: 'Room-image is not success remove!: S3-storage'

				this.logger.error(errorMessage)

				return ApiError.BadRequest(errorMessage)
			}
		}

		const resultRemoveRoom = await this.model.removeRoomById(roomId)

		if (!resultRemoveRoom)
			return ApiError.InternalServer(`Error from remove room: ID-${roomId}`)

		try {
			const allRooms = await this.model.getAllRooms(10, 0)

			if (resultRemoveRoom.id) {
				const deleteOneRoomCache = await delHashRedisClient(
					this.keysRoomsIds,
					resultRemoveRoom.id
				)

				if (!deleteOneRoomCache) {
					this.logger.error('Room-data from cache not success remove!')
				}
			}

			if (allRooms) {
				const updateCacheListRoom = await setListRedisClientWIthEx(
					this.keysRooms,
					this.keysRoomsIds,
					allRooms
				)

				if (
					typeof updateCacheListRoom === 'object' &&
					'message' in updateCacheListRoom
				) {
					this.logger.warn('New data rooms is not success safe to cache')
				}
			}
		} catch (error) {
			this.logger.warn(`Update room is not success safe to cache: ID-${roomId}`)
		}

		return {
			message: `Room have success delete: ID-${resultRemoveRoom.id}`,
		}
	}
}
