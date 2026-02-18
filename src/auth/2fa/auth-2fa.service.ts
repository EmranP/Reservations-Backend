import type { Logger } from 'winston'
import { BaseConfig } from '../../common/abstract/base-config.common'
import type {
	EnableTwoFactoryChallenge,
	VerifyTwoFactoryAuthDto,
} from '../dto/2fa.dto'

import { UserDto } from '../../admin/users/dto/user.dto'
import type { IUser } from '../../app/db/types/user.types'
import { setDateUtil } from '../../common/utils/app/date.util'
import type { AuthModel } from '../auth.model'
import type { TokenService } from '../token/token.service'
import type {
	IAuthResponseError,
	TypeAuthTwoFactoryService,
	TypeAuthUserService,
} from '../types/types.auth'
import type { AuthTwoFactoryChallengeModel } from './auth-2fa.model'

export class AuthTwoFactoryChallengeService extends BaseConfig {
	constructor(
		private model: AuthTwoFactoryChallengeModel,
		private authMode: AuthModel,
		private tokenService: TokenService,
		private logger: Logger
	) {
		super()
	}

	async enableTwoFactory(
		userId: string,
		dto: EnableTwoFactoryChallenge
	): Promise<IAuthResponseError | boolean> {
		const editEnableTwoFactory = await this.model.enableTwoFactory(
			userId,
			dto.isEnableTwoAuthCode
		)

		if (!editEnableTwoFactory || editEnableTwoFactory === null)
			return {
				message: 'Error update enable two-factory',
				status: 500,
			}

		this.logger.info(
			`Edit option enable two-factory: ${editEnableTwoFactory.enable_two_factory_challenge}`
		)

		return editEnableTwoFactory.enable_two_factory_challenge
	}

	async getCode(userId: string | undefined): TypeAuthTwoFactoryService {
		if (!userId)
			return {
				message: 'User is not founded!',
				status: 400,
			}

		const getTwoFactoryCode = await this.model.findOneCode(userId)

		if (!getTwoFactoryCode)
			return {
				message: 'Error code is not founded',
				status: 404,
			}

		return {
			code: getTwoFactoryCode.is_two_auth_code,
			expireCode: getTwoFactoryCode.expires_two_auth_code,
		}
	}

	async verifyTwoFactoryCode(
		dto: VerifyTwoFactoryAuthDto
	): TypeAuthUserService {
		const now = new Date()
		let user: IUser | null | undefined

		if (dto.email) {
			user = await this.authMode.getUserByEmail(dto.email)
		} else if (dto.phone) {
			user = await this.authMode.getUserByPhone(dto.phone)
		}

		if (!user || !user.id)
			return {
				message: 'User not founded!',
				status: 404,
			}

		const userDto = new UserDto(user)

		if (!userDto.id || userDto.role === undefined || userDto.role === null)
			return {
				message: 'User is not founded!',
				status: 404,
			}

		if (!userDto.isVerify)
			return {
				message: 'User is account is not verify',
				status: 400,
			}

		if (!userDto.enableTwoFactoryChallenge)
			return {
				message: 'User is not enable 2FA',
				status: 400,
			}

		const userTowFactoryData = await this.getCode(user.id)

		if ('message' in userTowFactoryData)
			return {
				message: userTowFactoryData.message,
				status: 404,
			}

		const isTimeCheckTwoFactory =
			userTowFactoryData.expireCode !== null &&
			now.getTime() >= userTowFactoryData.expireCode.getTime()

		if (isTimeCheckTwoFactory) {
			const updateTwoFactoryCode = await this.model.updateTwoFactoryAuthCode(
				null,
				null,
				userDto.id
			)

			if (!updateTwoFactoryCode)
				return {
					message: 'Error update two-factory code',
					status: 500,
				}

			this.isFirstSendEmailTwoFactoryCode = true

			return {
				message: this.errorExpireTwoFactoryCodeMessage,
				status: 400,
			}
		}

		if (dto.code !== userTowFactoryData.code)
			return {
				message: 'Incorrect code',
				status: 400,
			}

		const tokens = await this.tokenService.generateTokens({
			id: userDto.id,
			role: userDto.role,
		})

		if (!tokens.refresh || typeof tokens.refresh !== 'string')
			return {
				message: 'Error refresh-token is not generate',
				status: 500,
			}

		const expireRefreshTokenAt = setDateUtil(this.maxAgeRefresh)
		await this.tokenService.saveToken(
			userDto.id,
			tokens.refresh,
			expireRefreshTokenAt
		)

		return {
			user: userDto,
			accessToken: tokens.access,
			refreshToken: tokens.refresh,
			expireRefreshTokenAt,
		}
	}
}
