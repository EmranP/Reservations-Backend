import fs from 'fs/promises'
import type { Client } from 'minio'
import sharp from 'sharp'
import type { Logger } from 'winston'
import { userBucketName } from '../../app/s3/init-cloud-storage.app'
import { BaseConfig } from '../../common/abstract/base-config.common'
import { DB_TABLE_USERS } from '../../common/constants/table-db.constant'
import { checkCacheRedisClient } from '../../common/redis/utils/check-cache.util'
import {
	delHashRedisClient,
	getAllListRedisClient,
	getRedisClientHashKey,
	setListRedisClientWIthEx,
} from '../../common/redis/utils/grud-redis.util'
import type {
	IAppMessage,
	IGetAllDataWithMeta,
} from '../../common/types/app/app.type'
import type { IContextFiles } from '../../common/types/middlewares/app.types-middleware'
import { assetsPath } from '../../common/utils/format/path.util'
import { ApiError } from '../../common/utils/log/exists-error.log'
import type { AdminUserEditDto } from './dto/edit.dto'
import { AdminUsersDto } from './dto/user.dto'
import type { IAdminUserDto } from './types/dto.interface'
import type { UserModel } from './user.model'

export class UserService extends BaseConfig {
	constructor(
		private model: UserModel,
		private clientS3: Client,
		private logger: Logger
	) {
		super()
	}

	async findAllUser(
		limit: number = 10,
		limitCache: number,
		offset: number = 0
	): Promise<IGetAllDataWithMeta<Partial<IAdminUserDto>> | ApiError> {
		const allUserCache = await getAllListRedisClient(
			this.keysUsers,
			this.keysUsersIds,
			limitCache,
			offset
		)
		const allUser = await checkCacheRedisClient(
			allUserCache,
			() => this.model.getAllUserModel(limit, offset),
			'All users get from cache',
			'All users get from database'
		)
		const total = await this.getModelCount(DB_TABLE_USERS, this.logger)

		if (!allUser.length || !total)
			return ApiError.NotFound('Users not founded!')

		const usersDto = allUser.map(item => new AdminUsersDto(item).toPlain())

		if (!allUserCache.length) {
			try {
				if (allUser.length) {
					const updateCacheListRoom = await setListRedisClientWIthEx(
						this.keysUsers,
						this.keysUsersIds,
						allUser
					)

					if (
						typeof updateCacheListRoom === 'object' &&
						'message' in updateCacheListRoom
					) {
						this.logger.warn(
							'New data admin-users is not success safe to cache'
						)
					}
				}
			} catch (error) {
				this.logger.warn(`Get-all admin-users is not success safe to cache`)
			}
		}

		return {
			data: usersDto,
			meta: {
				total,
				limit,
				offset,
			},
		}
	}

	async findOneUser(
		userId: string | undefined
	): Promise<AdminUsersDto | ApiError> {
		if (!userId) return ApiError.NotFound('User-id not founded!')

		const getUserCache = await getRedisClientHashKey(this.keysUsersIds, userId)
		const getUser = await checkCacheRedisClient(
			getUserCache,
			() => this.model.getUserByIdModel(userId),
			'User get from cache',
			'User get from database'
		)

		if (!getUser) return ApiError.NotFound('User not founded from db!')

		const userDto = new AdminUsersDto(getUser)

		return userDto
	}

	async updateUser(
		userId: string | undefined,
		isDev: string | undefined,
		dto: AdminUserEditDto,
		fileBody: IContextFiles | undefined
	): Promise<IAppMessage | ApiError> {
		if (!userId) return ApiError.NotFound('Error user not founded!')

		if (
			(fileBody?.fileBufferData && fileBody.fileBufferData === null) ||
			(fileBody?.fileBufferData &&
				typeof fileBody.fileBufferData === 'undefined')
		)
			return ApiError.BadRequest('file data is not founded!')

		let getUserCache: undefined | string | null

		if (dto.email) {
			getUserCache = await getRedisClientHashKey(
				'users:emails',
				`user:email:${dto.email}`
			)
		} else if (dto.phone) {
			getUserCache = await getRedisClientHashKey(
				'users:phones',
				`user:phone:${dto.phone}`
			)
		} else {
			getUserCache = await getRedisClientHashKey(this.keysUsersIds, userId)
		}

		const getUser = await checkCacheRedisClient(
			getUserCache,
			() => this.model.getUserByIdModel(userId),
			'User get from cache for update!',
			'User get from database for update!'
		)

		if (!getUser) return ApiError.NotFound('User not founded from db!')

		let imagePath: string | undefined
		if (fileBody?.fileBufferData) {
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

			const filename = `${userId}.${format}`

			if (isDev === this.devMode) {
				imagePath = assetsPath(
					__dirname,
					`../../../assets/img/user/${filename}`
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
						error instanceof Error
							? error.message
							: 'File is not success upload!'

					return ApiError.BadRequest(errorMessage)
				}
			} else {
				try {
					await this.clientS3.putObject(
						userBucketName,
						filename,
						fileBody.fileBufferData,
						size
					)

					this.logger.info(
						'Users-image success upload to s3-storage from admin-panel'
					)

					const getProfileImageUrl = await this.clientS3.presignedGetObject(
						userBucketName,
						filename,
						this.expireS3Image,
						{
							'Content-Type': `image/${format}`,
							'response-content-disposition': 'inline',
							'Cache-Control': 'no-cache, no-store, must-revalidate',
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
		}

		const updateUser = await this.model.editUserModel(
			getUser.id,
			dto,
			fileBody?.fileBufferData ? imagePath : getUser.picture
		)

		if (!updateUser) return ApiError.BadRequest('Error from update user!')

		try {
			const allUsers = await this.model.getAllUserModel(10, 0)

			if (allUsers?.length) {
				const updateCacheListUsers = await setListRedisClientWIthEx(
					this.keysUsers,
					this.keysUsersIds,
					allUsers
				)

				if (
					typeof updateCacheListUsers === 'object' &&
					'message' in updateCacheListUsers
				) {
					this.logger.warn('Add new data admin-user to cache')
				}
			}
		} catch (error) {
			this.logger.warn(
				`Update admin-user is not success safe to cache: ID-${getUser.id}`
			)
		}

		return {
			message: 'User has success updated!',
		}
	}

	async deleteUser(
		userId: string | undefined,
		isDev: string | undefined
	): Promise<IAppMessage | ApiError> {
		if (!userId) return ApiError.NotFound('User-id not founded!')

		const getUserCache = await getRedisClientHashKey(this.keysUsersIds, userId)
		const getUser = await checkCacheRedisClient(
			getUserCache,
			() => this.model.getUserByIdModel(userId),
			'User get from cache for update!',
			'User get from database for update!'
		)

		if (!getUser) return ApiError.NotFound('User not founded from db!')

		const removeUser = await this.model.removeUserModel(getUser.id)

		if (!removeUser) return ApiError.BadRequest('Error from update user!')

		let imagePath: string | undefined
		const filename = `${userId}.png`

		if (isDev === this.devMode) {
			imagePath = assetsPath(
				__dirname,
				`../${this.pathAssets}/img/user/${filename}`
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
				await this.clientS3.removeObject(userBucketName, filename)

				this.logger.warn('User-image success deleted from admin-panel S3!')
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: 'User-image is not success remove from admin-panel S3!'

				this.logger.error(errorMessage)

				return ApiError.BadRequest(errorMessage)
			}
		}

		try {
			const resetUserIds = await delHashRedisClient(
				this.keysUsersIds,
				getUser.id
			)
			if (typeof resetUserIds === 'object' && 'message' in resetUserIds) {
				this.logger.warn('User is not success delete from cache!')
			}

			const allUsers = await this.model.getAllUserModel(10, 0)
			if (allUsers?.length) {
				const updateCacheListUsers = await setListRedisClientWIthEx(
					this.keysUsers,
					this.keysUsersIds,
					allUsers
				)

				if (
					typeof updateCacheListUsers === 'object' &&
					'message' in updateCacheListUsers
				) {
					this.logger.warn('Add new data admin-user to cache')
				}
			}
		} catch (error) {
			this.logger.warn(
				`Update admin-user is not success safe to cache: ID-${getUser.id}`
			)
		}

		return {
			message: 'User has success delete!',
		}
	}
}
