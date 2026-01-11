import bcrypt from 'bcrypt'
import { v4 as uuidV4 } from 'uuid'
import type { Logger } from 'winston'
import type { IUser } from '../app/db/types/user.types'
import { APP_CONFIG, APP_REDIS_CONFIG } from '../common/config/app.config'
import { AUTH_METHOD } from '../common/constants/enum.constant'
import {
	activationLinkHandler,
	genLinks,
} from '../common/constants/link.constant'
import { isVerifyTokenError } from '../common/utils/app/checkType.utils'
import {
	setDateUtil,
	setHoursUtil,
	setMinuteUtil,
	setSecundUtil,
} from '../common/utils/app/date.util'
import { renderSendActivationLink } from '../common/utils/format/render.util'
import { ApiError } from '../common/utils/log/exists-error.log'

import { checkCacheRedisClient } from '../common/redis/utils/check-cache.util'
import {
	getRedisClientHashKey,
	setHashRedisClientWithEx,
} from '../common/redis/utils/grud-redis.util'
import { UserDto } from '../user/dto/user.dto'
import type { UserModel } from '../user/user.model'
import type { AuthTwoFactoryChallengeModel } from './2fa/auth-2fa.model'
import type { AuthTwoFactoryChallengeService } from './2fa/auth-2fa.service'
import { AuthBaseConfig } from './abstract/auth-config.base'
import { AuthModel } from './auth.model'
import type { ForgetDto } from './dto/forget.dto'
import type { LoginDto } from './dto/login.dto'
import type { RegistrationDto } from './dto/registration.dto'
import { authEmailService } from './index.auth'
import type { TokenService } from './token/token.service'
import type {
	IAuthUserService,
	TypeAuthServiceMessageWithApiError,
	TypeAuthUserService,
} from './types/types.auth'

export class AuthService extends AuthBaseConfig {
	constructor(
		private model: AuthModel,
		private authTwoFactoryModel: AuthTwoFactoryChallengeModel,
		private authTowFactoryService: AuthTwoFactoryChallengeService,
		private userModel: UserModel,
		private tokenService: TokenService,
		private logger: Logger
	) {
		super()
	}

	//! BASE-METHOD-AUTH =================================================
	async login(dto: LoginDto): TypeAuthUserService {
		if (!APP_REDIS_CONFIG.DEFAULT_EXPIRES_TIME_REDIS)
			return ApiError.InternalServer('Error not set redis-config default time!')

		const now = new Date()
		// User
		let user: IUser | null | undefined
		if (dto.email) {
			const userEmailRedis = await getRedisClientHashKey(
				'users:emails',
				`user:email:${dto.email}`
			)

			user = await checkCacheRedisClient(
				userEmailRedis,
				() => this.model.getUserByEmail(dto.email),
				`user-email cache ${user?.email}`,
				`user-email no cache ${user?.email}`
			)
		} else if (dto.phone) {
			const userPhoneRedis = await getRedisClientHashKey(
				'users:phones',
				`user:phone:${dto.phone}`
			)

			user = await checkCacheRedisClient(
				userPhoneRedis,
				() => this.model.getUserByPhone(dto.phone),
				`user-phone cache ${user?.phone}`,
				`user-phone no cache ${user?.phone}`
			)
		}

		if (!user || !user.id) return { message: 'User not founded', status: 404 }

		const isPassEquals = await bcrypt.compare(
			String(dto.password),
			user.password
		)

		if (!isPassEquals) return { message: 'Password is not right', status: 400 }

		const userDto = new UserDto(user)

		if (!userDto.isVerify)
			return {
				message: 'User is account is not verify',
				status: 400,
			}

		if (!userDto.id || !userDto.role)
			return {
				message: 'Bad-request user dto from login-email',
				status: 500,
			}

		// 2FA
		if (userDto.enableTwoFactoryChallenge) {
			const userTowFactoryData = await this.authTowFactoryService.getCode(
				userDto.id
			)

			if (
				'message' in userTowFactoryData &&
				!this.isFirstSendEmailTwoFactoryCode
			)
				return {
					message: userTowFactoryData.message,
					status: userTowFactoryData.status,
				}

			const isTimeCheckTwoFactory =
				'expireCode' in userTowFactoryData &&
				userTowFactoryData.expireCode !== null &&
				now.getTime() >= userTowFactoryData.expireCode.getTime()

			if (isTimeCheckTwoFactory && !this.isFirstSendEmailTwoFactoryCode) {
				const updateTwoFactoryCode =
					await this.authTwoFactoryModel.updateTwoFactoryAuthCode(
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

			if (userDto.email && 'expireCode' in userTowFactoryData) {
				const resultSendEmailCode = await authEmailService.sendTwoFactoryCode(
					userDto.email,
					isTimeCheckTwoFactory,
					userTowFactoryData.expireCode,
					userTowFactoryData.code,
					this.isFirstSendEmailTwoFactoryCode
				)

				if (resultSendEmailCode.status >= 400)
					return {
						message: resultSendEmailCode.message,
						status: resultSendEmailCode.status,
					}

				const expiresTwoFactoryCode = setSecundUtil(this.maxAgeTwoFactoryCode)
				const updateTwoFactoryCode =
					await this.authTwoFactoryModel.updateTwoFactoryAuthCode(
						resultSendEmailCode.code,
						expiresTwoFactoryCode,
						userDto.id
					)

				if (!updateTwoFactoryCode)
					return {
						message: 'Error update two-factory code',
						status: 500,
					}

				this.isFirstSendEmailTwoFactoryCode = false

				return {
					message: !this.isFirstSendEmailTwoFactoryCode
						? resultSendEmailCode.message
						: this.expireTwoFactoryCodeMessage,
					status: !this.isFirstSendEmailTwoFactoryCode
						? resultSendEmailCode.status
						: 200,
					user: userDto,
				}
			}
		}

		if (dto.email) {
			const userEmailField = `user:email:${dto.email}`
			const newUserEmailCacheWithEx = await setHashRedisClientWithEx(
				'users:emails',
				userEmailField,
				user,
				APP_REDIS_CONFIG.ONE_DAY_EXPIRES_TIME_REDIS
			)

			if (
				typeof newUserEmailCacheWithEx === 'object' &&
				'message' in newUserEmailCacheWithEx
			)
				return newUserEmailCacheWithEx
		}

		if (dto.phone) {
			const userPhoneField = `user:phone:${dto.phone}`
			const newUserPhoneCacheWithEx = await setHashRedisClientWithEx(
				'users:phones',
				userPhoneField,
				user,
				APP_REDIS_CONFIG.ONE_DAY_EXPIRES_TIME_REDIS
			)

			if (
				typeof newUserPhoneCacheWithEx === 'object' &&
				'message' in newUserPhoneCacheWithEx
			)
				return newUserPhoneCacheWithEx
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

	async registration(dto: RegistrationDto): TypeAuthUserService {
		const now = new Date()
		const isTimeCheck =
			this.expiresVerify !== null &&
			now.getTime() >= this.expiresVerify.getTime()
		const isExpireVerifyMessage = !isTimeCheck || this.expiresVerify === null
		// Remove user
		const isTimeRemoveCheck =
			this.expiresRemoveVerify !== null &&
			now.getTime() >= this.expiresRemoveVerify.getTime()
		const isRemoveExpireVerifyMessage =
			!isTimeRemoveCheck || this.expiresRemoveVerify === null
		// Candidate
		let candidate: IUser | null | undefined

		if (dto.email) {
			const candidateEmailCache = await getRedisClientHashKey(
				'users:emails',
				`user:email:${dto.email}`
			)

			candidate = await checkCacheRedisClient(
				candidateEmailCache,
				() => this.model.getUserByEmail(dto.email),
				'Candidate founded from cache',
				'Candidate founded from Database'
			)
		} else if (dto.phone) {
			const candidatePhoneCache = await getRedisClientHashKey(
				'users:phones',
				`user:phone:${dto.phone}`
			)

			candidate = await checkCacheRedisClient(
				candidatePhoneCache,
				() => this.model.getUserByPhone(dto.phone),
				'Candidate founded from cache',
				'Candidate founded from Database'
			)
		}

		// Message
		const errorEmailMessage = `A user with email ${dto.email} already exists.`
		const errorPhoneMessage = `A user with phone ${dto.phone} already exists.`

		if (candidate?.id) {
			if (candidate.is_verify)
				return {
					message: errorEmailMessage,
					status: 400,
				}

			if (
				now.getHours() > candidate.created_at.getHours() &&
				!candidate.is_verify
			) {
				await this.userModel.removeUserModel(candidate.id)

				this.expiresVerify = null
				this.expiresRemoveVerify = null

				return {
					message: this.errorAgainExpireMessage,
					status: 400,
				}
			}

			if (
				(isTimeCheck && isTimeRemoveCheck && !candidate.is_verify) ||
				this.expiresRemoveVerify === null
			) {
				await this.userModel.removeUserModel(candidate.id)

				this.expiresVerify = null
				this.expiresRemoveVerify = null

				return {
					message: this.errorAgainExpireMessage,
					status: 400,
				}
			}

			if (
				(isTimeCheck && !candidate.is_verify) ||
				this.expiresVerify === null
			) {
				return {
					message: this.errorExpireMessage,
					status: 400,
				}
			}

			this.logger.info(
				isExpireVerifyMessage
					? this.expireMessage
					: isRemoveExpireVerifyMessage
					? this.errorAgainExpireMessage
					: candidate.email
					? errorEmailMessage
					: errorPhoneMessage
			)

			return {
				message: isExpireVerifyMessage
					? this.expireMessage
					: isRemoveExpireVerifyMessage
					? this.errorAgainExpireMessage
					: candidate.email
					? errorEmailMessage
					: errorPhoneMessage,
				status: isExpireVerifyMessage ? 409 : 400,
			}
		}

		const hasPass = await bcrypt.hash(String(dto.password), 10)
		const { activationLink, resetPassLink } = genLinks(uuidV4)

		const newDto = { ...dto, password: hasPass }

		const newUser = await this.model.createUserModel(
			newDto,
			activationLink,
			resetPassLink,
			AUTH_METHOD.CREDENTIALS
		)

		if (!newUser?.id) return { message: 'Error is not created', status: 500 }

		if (!APP_CONFIG.API_URL)
			return {
				message: 'App config is not set api-url',
				status: 500,
			}

		const link = activationLinkHandler(
			APP_CONFIG.API_URL,
			newUser.activation_link
		)
		const renderHtml = renderSendActivationLink(link, 'активировать аккаунт')

		const resultEmail = await authEmailService.send(
			dto.email,
			'Verify account',
			renderHtml
		)

		if (typeof resultEmail === 'undefined' || typeof resultEmail === 'string')
			return {
				message: 'Error sending email, please repaid sending!',
				status: 500,
			}

		this.expiresVerify = setMinuteUtil(this.maxAgeVerify)
		this.expiresRemoveVerify = setHoursUtil(this.maxAgeRemoveVerify)

		if (!newUser.is_verify)
			return {
				message: 'You has been add, please verify your account',
				status: 201,
			}

		return {
			message: 'User has success registration',
			status: 201,
		}
	}

	async verifyAccount(
		activationLink: string | null
	): TypeAuthServiceMessageWithApiError {
		const now = new Date()
		const isTimeCheck =
			this.expiresVerify !== null &&
			now.getTime() >= this.expiresVerify.getTime()
		const isTimeRemoveCheck =
			this.expiresRemoveVerify !== null &&
			now.getTime() >= this.expiresRemoveVerify.getTime()

		if (!activationLink || activationLink === null)
			return ApiError.NotFound('Activation link is must be empty')

		const isVerifyUser = await this.model.verifyModel({ activationLink })

		if (
			(isVerifyUser && !isVerifyUser.is_verify) ||
			typeof isVerifyUser === 'boolean'
		)
			return ApiError.BadRequest('Bad-request invalid link')

		if (
			isTimeRemoveCheck &&
			isVerifyUser &&
			!isVerifyUser.is_verify &&
			now.getHours() >= isVerifyUser.created_at.getHours()
		) {
			await this.userModel.removeUserModel(isVerifyUser.id)

			this.expiresRemoveVerify = null
			this.expiresVerify = null

			return ApiError.BadRequest(this.errorAgainExpireMessage)
		}

		if (isTimeCheck && isVerifyUser && isVerifyUser.id)
			return ApiError.BadRequest(this.errorExpireMessage)

		const user = new UserDto(isVerifyUser)

		this.expiresVerify = null
		this.expiresRemoveVerify = null

		return {
			message: user.isVerify
				? `The user has success verify account`
				: 'The user has not confirmed the account',
			status: 201,
		}
	}

	async refresh(token: string): Promise<Partial<IAuthUserService>> {
		return this.tokenService.refreshToken(token)
	}

	async logout(refreshToken: string): TypeAuthServiceMessageWithApiError {
		const isVerifyToken = await this.tokenService.verifyToken(refreshToken)

		if (isVerifyTokenError(isVerifyToken))
			return ApiError.BadRequest(isVerifyToken.message)

		if (!isVerifyToken.sub) return ApiError.BadRequest('User id is not have')

		const resultRemoveToken = await this.tokenService.deleteToken(
			isVerifyToken.sub,
			refreshToken
		)

		if (!resultRemoveToken)
			return ApiError.BadRequest('Something was wrong to logout')

		return {
			message: `Logout has success completed to USER-ID: ${resultRemoveToken.id}`,
			status: 201,
		}
	}

	//! ADVANCED-AUTH-METHOD =================================================
	async forgetPasswordVerify(
		resetLink: string | null | undefined
	): TypeAuthServiceMessageWithApiError {
		if (!resetLink || typeof resetLink === 'undefined')
			return ApiError.BadRequest('User not have link')

		const now = new Date()

		const { resetPassLink } = genLinks(uuidV4)
		const dto = (value: boolean) => ({ resetLink, isEnableResetPass: value })

		const isVerifyForgetUser = await this.model.forgetVerifyModel(dto(true))

		if (
			(isVerifyForgetUser && !isVerifyForgetUser.enable_reset_pass) ||
			typeof isVerifyForgetUser === 'boolean'
		)
			return ApiError.BadRequest('Bad-request invalid link')

		const expiresForgetVerify = await this.model.getExpireForget(
			isVerifyForgetUser.id
		)

		if (!expiresForgetVerify)
			return {
				message: 'expire forget verify not founded',
				status: 504,
			}

		const isTimeCheck =
			expiresForgetVerify.expires_forget_pass !== null &&
			now.getTime() >= expiresForgetVerify.expires_forget_pass.getTime()

		if (isTimeCheck || expiresForgetVerify.expires_forget_pass === null) {
			const resetForgetVerify = await this.model.resetForgetVerifyMode(
				resetPassLink,
				isVerifyForgetUser.id,
				false,
				null
			)

			if (!resetForgetVerify)
				return {
					message: 'Something was wrong with reset forget verify',
					status: 500,
				}

			this.isFirstVerifyForgetPassword = true

			return ApiError.BadRequest('The verify for forget password expired!')
		}

		if (
			!this.isFirstVerifyForgetPassword &&
			isVerifyForgetUser.enable_reset_pass
		)
			return ApiError.BadRequest(
				'You already success verify for reset password.',
				409
			)

		const user = new UserDto(isVerifyForgetUser)
		this.isFirstVerifyForgetPassword = false

		return {
			message: user.enableResetPass
				? 'You have success verify for reset password. Please set new password you have 30m'
				: 'You have is not success verify for reset password.',
			status: user.enableResetPass ? 201 : 400,
		}
	}

	async setNewPassword(
		dto: Pick<ForgetDto, 'email' | 'newPassword'>
	): TypeAuthServiceMessageWithApiError {
		const now = new Date()
		const { resetPassLink } = genLinks(uuidV4)
		const userCache = await getRedisClientHashKey(
			'users:emails',
			`user:email:${dto.email}`
		)
		let user: undefined | null | IUser

		if (userCache) {
			const parserUserCache = JSON.parse(userCache) as IUser
			user = parserUserCache
		} else {
			user = await this.model.getUserByEmail(dto.email)
		}

		if (!user || !user.id) return ApiError.NotFound('User not founded')

		const expiresForgetVerify = await this.model.getExpireForget(user.id)

		if (!expiresForgetVerify)
			return ApiError.InternalServer('Expire forget not founded!')

		if (
			!user.enable_reset_pass ||
			expiresForgetVerify.expires_forget_pass === null
		)
			return ApiError.BadRequest('User is not verify enable-reset password')

		const isTimeCheck =
			expiresForgetVerify.expires_forget_pass !== null &&
			now.getTime() >= expiresForgetVerify.expires_forget_pass.getTime()

		if (isTimeCheck) {
			const dtoReset = {
				isEnableResetPass: false,
				newPassword: user.password,
			}
			const initUserState = await this.model.resetUpdateUserPassword(
				user.id,
				resetPassLink,
				dtoReset,
				null
			)

			if (!initUserState)
				return ApiError.InternalServer('Error from reset user password')

			return ApiError.BadRequest('The verify for forget password expired!')
		}

		if (typeof dto.newPassword !== 'string')
			return {
				message: 'New password must be string',
				status: 400,
			}

		const hashPass = await bcrypt.hash(dto.newPassword, 10)

		const dtoReset = {
			isEnableResetPass: false,
			newPassword: hashPass,
		}
		const newUserState = await this.model.resetUpdateUserPassword(
			user.id,
			resetPassLink,
			dtoReset,
			null
		)

		if (!newUserState?.id)
			return ApiError.InternalServer('Error from set new password')

		return {
			message: `User have success updated password`,
			status: 201,
		}
	}
}
