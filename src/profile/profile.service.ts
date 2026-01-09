import type { Logger } from 'winston'
import { checkCacheRedisClient } from '../common/redis/utils/check-cache.util'
import {
	getRedisClientHashKey,
	setHashRedisClientWithEx,
} from '../common/redis/utils/grud-redis.util'
import type { IAppMessage } from '../common/types/app/app.type'
import { ApiError } from '../common/utils/log/exists-error.log'
import { UserDto } from '../user/dto/user.dto'
import type { EditProfileDto } from './dto/edit-profile.dto'
import type { ProfileModel } from './profile.model'
import type { IProfile } from './types/types.profile'

export class ProfileService {
	constructor(private model: ProfileModel, private logger: Logger) {}

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
			this.logger.info('Profile success get from cache!'),
			this.logger.info('Profile success get from database!')
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

	async uploadProfileImage(userId: string) {}

	async removeProfileImage(userId: string) {}
}
