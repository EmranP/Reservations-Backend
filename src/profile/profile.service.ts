import fs from 'fs/promises'
import sharp from 'sharp'
import type { Logger } from 'winston'
import { AuthBaseConfig } from '../auth/abstract/auth-config.base'
import { checkCacheRedisClient } from '../common/redis/utils/check-cache.util'
import {
	getRedisClientHashKey,
	setHashRedisClientWithEx,
} from '../common/redis/utils/grud-redis.util'
import type { IAppMessage } from '../common/types/app/app.type'
import type { IContextFiles } from '../common/types/middlewares/app.types-middleware'
import { assetsPath } from '../common/utils/format/path.util'
import { ApiError } from '../common/utils/log/exists-error.log'
import { UserDto } from '../user/dto/user.dto'
import type { EditProfileDto } from './dto/edit-profile.dto'
import type { ProfileModel } from './profile.model'
import type { IProfile } from './types/types.profile'

export class ProfileService extends AuthBaseConfig {
	constructor(private model: ProfileModel, private logger: Logger) {
		super()
	}

	async findOneProfile(
		userId: string | undefined
	): Promise<IProfile | ApiError> {
		if (!userId) return ApiError.NotFound('User ID not founded!')
		
		const userProfileCache = await getRedisClientHashKey(
			'users:ids',
			`user:id:${userId}`
		)

		const userProfile = await checkCacheRedisClient(
			userProfileCache,
			() => this.model.getProfileMe(userId),
			'Profile success get from cache!',
			'Profile success get from database!'
		)

		if (!userProfile)
			return ApiError.NotFound('User not founded from Database!')

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
		dto: string,
		isDevMode: string | undefined,
		fileBody: IContextFiles
	): Promise<IAppMessage | ApiError> {
		if (!userId) return ApiError.NotFound('User id not founded!')

		if (
			fileBody.fileBufferData === null ||
			typeof fileBody.fileBufferData === 'undefined'
		)
			return ApiError.BadRequest('file-buffer data is not founded!')

		if (isDevMode === this.devMode) {
			try {
				const { format, size, width, height } = await sharp(
					fileBody.fileBufferData
				).metadata()

				if (size && size > this.MAX_FILE_SIZE) {
					this.logger.warn('Image is too large!')

					return ApiError.BadRequest('Image is too large!')
				}

				if (!format) {
					this.logger.warn('File data is must be type file media!')

					return ApiError.BadRequest('File data is must be type file media!')
				}

				if (width < 200 || height < 200) {
					this.logger.warn('Image width or height is too small')

					return ApiError.BadRequest('Image width or height is too small')
				}

				if (width > 2048 || height > 2048) {
					this.logger.warn('Image width or height is too large')

					return ApiError.BadRequest('Image width or height is too large')
				}

				//? Optional validate
				// const ratio = width / height
				// if (Math.abs(ratio - 1) > 0.05) {
				// 	this.logger.warn('Image must be square')

				// 	return ApiError.BadRequest('Image must be square')
				// }

				const imageData = await sharp(fileBody.fileBufferData)
					.resize(512, 512, { fit: 'cover', position: 'center' })
					.webp({ quality: 85 })
					.toFile(assetsPath(__dirname, `../../assets/img/user/${userId}.webp`))

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

		const messageBadRequest = `Bad-request profile-image is not success upload!`
		const messageSuccess = `Profile image is success upload: ID-${userId}`

		const isUpdateProfile = await this.model.updateProfileImage(userId, dto)

		if (!isUpdateProfile) return ApiError.BadRequest(messageBadRequest)

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
		imagePath: string,
		dto: null,
		isDevMode: string | undefined
	): Promise<IAppMessage | ApiError> {
		if (!userId) return ApiError.NotFound('User ID not founded!')

		const messageBadRequest = `Bad-request profile-image is not remove upload!`
		const messageSuccess = `Profile image is success remove: ID-${userId}`

		if (isDevMode === this.devMode) {
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
		}

		const isRemoveProfile = await this.model.updateProfileImage(userId, dto)

		if (!isRemoveProfile) return ApiError.BadRequest(messageBadRequest)

		const updateUserProfileCache = await setHashRedisClientWithEx(
			'users:ids',
			`user:id:${userId}`,
			isRemoveProfile
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
