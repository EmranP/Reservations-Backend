import fs from 'fs/promises'
import type { Client } from 'minio'
import sharp from 'sharp'
import type { Logger } from 'winston'
import { UserDto } from '../admin/users/dto/user.dto'
import { userBucketName } from '../app/s3/init-cloud-storage.app'
import { BaseConfig } from '../common/abstract/base-config.common'
import { checkCacheRedisClient } from '../common/redis/utils/check-cache.util'
import {
	delHashRedisClient,
	getRedisClientHashKey,
	setHashRedisClientWithEx,
} from '../common/redis/utils/grud-redis.util'
import type { IAppMessage } from '../common/types/app/app.type'
import type { IContextFiles } from '../common/types/middlewares/app.types-middleware'
import { setDateUtil } from '../common/utils/app/date.util'
import { assetsPath } from '../common/utils/format/path.util'
import { ApiError } from '../common/utils/log/exists-error.log'
import type { EditProfileDto } from './dto/edit-profile.dto'
import type { ProfileModel } from './profile.model'
import type { IProfile } from './types/types.profile'

export class ProfileService extends BaseConfig {
	private messageUploadBadRequest = `Bad-request profile-image is not success upload!`

	constructor(
		private model: ProfileModel,
		private clientS3: Client,
		private logger: Logger
	) {
		super()
	}

	async findOneProfile(
		userId: string | undefined
	): Promise<IProfile | ApiError> {
		if (!userId) return ApiError.NotFound('User ID not founded!')
		const now = new Date()

		const userProfileCache = await getRedisClientHashKey(
			'users:ids',
			`user:id:${userId}`
		)

		let userProfile = await checkCacheRedisClient(
			userProfileCache,
			() => this.model.getProfileMe(userId),
			'Profile success get from cache!',
			'Profile success get from database!'
		)

		if (!userProfile)
			return ApiError.NotFound('User not founded from Database!')

		if (
			userProfile.expire_picture_url !== null &&
			now.getTime() >= new Date(userProfile.expire_picture_url).getTime()
		) {
			const expireProfileImageUrl = setDateUtil(7)
			const newProfileImageUrl = await this.clientS3.presignedGetObject(
				userBucketName,
				`${userProfile.id}.png`,
				this.expireS3Image,
				{
					'response-content-disposition': 'inline',
				}
			)

			const isUpdateProfile = await this.model.updateProfileImage(
				userProfile.id,
				newProfileImageUrl,
				expireProfileImageUrl
			)

			if (!isUpdateProfile)
				return ApiError.BadRequest(this.messageUploadBadRequest)

			const updateUserProfileCache = await setHashRedisClientWithEx(
				'users:ids',
				`user:id:${userId}`,
				isUpdateProfile
			)

			if (
				typeof updateUserProfileCache === 'object' &&
				'message' in updateUserProfileCache
			) {
				this.logger.error(updateUserProfileCache.message)
			}

			userProfile = isUpdateProfile
		}

		const userProfileDto = new UserDto(userProfile)

		if (!userProfileCache) {
			const newUserProfileCache = await setHashRedisClientWithEx(
				'users:ids',
				`user:id:${userId}`,
				userProfile
			)

			if (
				typeof newUserProfileCache === 'object' &&
				'message' in newUserProfileCache
			) {
				this.logger.error('Error from add new user-profile to cache!')
			}
		}

		return {
			profile: userProfileDto,
		}
	}

	async editProfile(
		userId: string | undefined,
		dto: EditProfileDto
	): Promise<IAppMessage | ApiError> {
		if (!userId) return ApiError.NotFound('User ID not founded!')

		const updateUserProfile = await this.model.updateProfile(userId, dto)

		if (!updateUserProfile)
			return ApiError.InternalServer('User profile is not success update!')

		const updateUserProfileCache = await setHashRedisClientWithEx(
			'users:ids',
			`user:id:${userId}`,
			updateUserProfile
		)

		if (
			typeof updateUserProfileCache === 'object' &&
			'message' in updateUserProfileCache
		) {
			this.logger.error(updateUserProfileCache.message)
		}

		return {
			message: 'Profile data success update!',
		}
	}

	async uploadProfileImage(
		userId: string | undefined,
		isDevMode: string | undefined,
		fileBody: IContextFiles
	): Promise<IAppMessage | ApiError> {
		if (!userId) return ApiError.NotFound('User id not founded!')

		if (
			fileBody.fileBufferData === null ||
			typeof fileBody.fileBufferData === 'undefined'
		)
			return ApiError.BadRequest('file data is not founded!')

		const { format, size, width, height } = await sharp(
			fileBody.fileBufferData
		).metadata()
		const isValid = this.validateImageFile(size, format, width, height)

		if (typeof isValid === 'object' && 'message' in isValid)
			return ApiError.BadRequest(isValid.message)

		let imagePath: string | undefined
		const filename = `${userId}.${format}`

		if (isDevMode !== this.devMode) {
			try {
				imagePath = assetsPath(
					__dirname,
					`${this.pathAssets}/img/user/${filename}`
				)

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
						: 'File is not success upload to dev-mode!'

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

				this.logger.info('Profile-image success upload to s3-storage')

				const getProfileImageUrl = await this.clientS3.presignedGetObject(
					userBucketName,
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

		const messageSuccess = `Profile image is success upload: ID-${userId}`
		const expireUrlProfileImage = setDateUtil(7)

		const isUpdateProfile = await this.model.updateProfileImage(
			userId,
			imagePath,
			expireUrlProfileImage
		)

		if (!isUpdateProfile)
			return ApiError.BadRequest(this.messageUploadBadRequest)

		const updateUserProfileCache = await setHashRedisClientWithEx(
			'users:ids',
			`user:id:${userId}`,
			isUpdateProfile
		)

		if (
			typeof updateUserProfileCache === 'object' &&
			'message' in updateUserProfileCache
		) {
			this.logger.error(updateUserProfileCache.message)
		}

		return {
			message: messageSuccess,
		}
	}

	async removeProfileImage(
		userId: string | undefined,
		dto: null,
		isDevMode: string | undefined
	): Promise<IAppMessage | ApiError> {
		if (!userId) return ApiError.NotFound('User ID not founded!')

		const messageBadRequest = `Bad-request profile-image is not remove!`
		const messageSuccess = `Profile image is success remove: ID-${userId}`

		let imagePath: string | undefined
		const filename = `${userId}.png`

		if (isDevMode !== this.devMode) {
			imagePath = assetsPath(
				__dirname,
				`${this.pathAssets}/img/user/${filename}`
			)

			try {
				await fs.access(imagePath)

				await fs.unlink(imagePath)
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: 'Profile-image is not success remove!: Dev-mode'

				this.logger.error(errorMessage)

				return ApiError.BadRequest(errorMessage)
			}
		} else {
			try {
				await this.clientS3.removeObject(userBucketName, filename)

				this.logger.warn('Profile-image success deleted from S3!')
			} catch (error) {
				const errorMessage =
					error instanceof Error
						? error.message
						: 'Profile-image is not success remove!: S3-storage'

				this.logger.error(errorMessage)

				return ApiError.BadRequest(errorMessage)
			}
		}

		const isRemoveProfile = await this.model.updateProfileImage(
			userId,
			dto,
			null
		)

		if (!isRemoveProfile) return ApiError.BadRequest(messageBadRequest)

		const updateUserProfileCache = await delHashRedisClient(
			'users:ids',
			`user:id:${userId}`
		)

		if (
			typeof updateUserProfileCache === 'object' &&
			'message' in updateUserProfileCache
		) {
			this.logger.error(updateUserProfileCache.message)
		}

		return {
			message: messageSuccess,
		}
	}
}
