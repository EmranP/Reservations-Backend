import bcrypt from 'bcrypt'
import { v4 as uuidV4 } from 'uuid'
import type { Logger } from 'winston'
import { APP_CONFIG } from '../common/config/app.config'
import {
	activationLinkHandler,
	genLinks,
	resetPassLinkHandler,
} from '../common/constants/link.constant'
import { isVerifyTokenError } from '../common/utils/app/checkType.utils'
import { setHoursUtil, setMinuteUtil } from '../common/utils/app/date.util'
import { renderSendActivationLink } from '../common/utils/format/render.util'
import { ApiError } from '../common/utils/log/exists-error.log'
import { UserDto } from '../user/dto/user.dto'
import type { UserModel } from '../user/user.model'
import { AuthModel } from './auth.model'
import type { ForgetDto } from './dto/forget.dto'
import type { LoginDto } from './dto/login.dto'
import type { RegistrationDto } from './dto/registration.dto'
import type { RepaidVerifyDto } from './dto/verify.dto'
import { authEmailService } from './index.auth'
import type { TokenService } from './token/token.service'
import type {
	IAuthUserService,
	TypeAuthServiceMessageWithApiError,
	TypeAuthUserService,
} from './types/types.auth'

export class AuthService {
	private verifyConfig: string | undefined = APP_CONFIG.EXPIRES_USER_VERIFY
	private verifyRemoveConfig: string | undefined =
		APP_CONFIG.EXPIRES_USER_REMOVE_VERIFY
	private forgetConfig: string | undefined =
		APP_CONFIG.EXPIRES_USER_RESET_PASSWORD_VERIFY
	// Age
	private maxAgeVerify: number =
		this.verifyConfig === '2m' ? 2 : this.verifyConfig === '5m' ? 5 : 0
	private maxAgeRemoveVerify: number = this.verifyRemoveConfig === '1h' ? 1 : 0
	private maxAgeResetVerify: number = this.forgetConfig === '30m' ? 1 : 5
	// Flags
	private isFirstSendEmailVerifyAccount: boolean = true
	private isFirstSendEmailForgetPassword: boolean = true
	private isFirstVerifyForgetPassword: boolean = true
	// Expire
	private expiresVerify: Date | null = null
	private expiresRemoveVerify: Date | null = null
	private expiresForgetVerify: Date | null = null
	// Message
	private expireMessage: string = `Please confirm your account verify the link, you have ${
		this.verifyConfig === '2m' ? 2 : 1
	} minutes to do this.`

	private errorExpireMessage: string =
		'Unfortunately, your confirmation time has expired, Do you wants again send email if you not verify time has 1 hour. Please register again.'
	private errorAgainExpireMessage: string =
		'Unfortunately, your confirmation time has expired, please register again.'

	constructor(
		protected model: AuthModel,
		private userModel: UserModel,
		protected tokenService: TokenService,
		protected logger: Logger
	) {}

	//! BASE-METHOD-AUTH =================================================
	async loginEmail(dto: LoginDto): TypeAuthUserService {
		const userEmail = await this.model.getUserByEmail(dto.email)

		if (!userEmail || !userEmail.id)
			return { message: 'User email not founded', status: 404 }

		const isPassEquals = await bcrypt.compare(
			String(dto.password),
			userEmail?.password
		)

		if (!isPassEquals) return { message: 'Password is not right', status: 400 }

		const userDto = new UserDto(userEmail)

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

		const tokens = await this.tokenService.generateTokens({
			id: userDto.id,
			role: userDto.role,
		})

		if (!tokens.refresh || typeof tokens.refresh !== 'string')
			return {
				message: 'Error refresh-token is not generate',
				status: 500,
			}

		await this.tokenService.saveToken(userDto.id, tokens.refresh)

		return {
			user: userDto,
			accessToken: tokens.access,
			refreshToken: tokens.refresh,
		}
	}

	async loginPhone(dto: LoginDto): TypeAuthUserService {
		const userPhone = await this.model.getUserByPhone(dto.phone)

		if (!userPhone || !userPhone.id)
			return { message: 'User phone not founded', status: 404 }

		const isPassEquals = await bcrypt.compare(
			String(dto.password),
			userPhone.password
		)

		if (!isPassEquals) return { message: 'Password is not right', status: 400 }

		const userDto = new UserDto(userPhone)

		if (!userDto.isVerify)
			return {
				message: 'User is account is not verify',
				status: 400,
			}

		if (!userDto.id || !userDto.role)
			return {
				message: 'Bad-request user dto from login-phone',
				status: 500,
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

		await this.tokenService.saveToken(userDto.id, tokens.refresh)

		return {
			user: userDto,
			accessToken: tokens.access,
			refreshToken: tokens.refresh,
		}
	}

	async registration(dto: RegistrationDto): TypeAuthUserService {
		const now = new Date()
		const isTimeCheck =
			this.expiresVerify !== null &&
			now.getTime() >= this.expiresVerify.getTime()
		const isTimeRemoveCheck =
			this.expiresRemoveVerify !== null &&
			now.getTime() >= this.expiresRemoveVerify.getTime()

		const isExpireVerifyMessage = !isTimeCheck || this.expiresVerify === null
		const isRemoveExpireVerifyMessage =
			!isTimeRemoveCheck || this.expiresRemoveVerify === null

		// Candidate
		const candidateEmail = await this.model.getUserByEmail(dto.email)
		const candidatePhone = await this.model.getUserByPhone(dto.phone)
		// Message
		const errorEmailMessage = `A user with email ${dto.email} already exists.`
		const errorPhoneMessage = `A user with phone ${dto.phone} already exists.`

		if (candidateEmail?.id) {
			if (candidateEmail.is_verify)
				return {
					message: errorEmailMessage,
					status: 400,
				}

			if (
				now.getHours() > candidateEmail.created_at.getHours() &&
				!candidateEmail.is_verify
			) {
				await this.userModel.removeUserModel(candidateEmail.id)

				this.expiresVerify = null
				this.expiresRemoveVerify = null

				return {
					message: this.errorAgainExpireMessage,
					status: 400,
				}
			}

			if (
				(isTimeCheck && isTimeRemoveCheck && !candidateEmail.is_verify) ||
				this.expiresRemoveVerify === null
			) {
				await this.userModel.removeUserModel(candidateEmail.id)

				this.logger.debug('Test-2')

				this.expiresVerify = null
				this.expiresRemoveVerify = null

				return {
					message: this.errorAgainExpireMessage,
					status: 400,
				}
			}

			if (
				(isTimeCheck && !candidateEmail.is_verify) ||
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
					: errorEmailMessage
			)

			return {
				message: isExpireVerifyMessage
					? this.expireMessage
					: isRemoveExpireVerifyMessage
					? this.errorAgainExpireMessage
					: errorEmailMessage,
				status: isExpireVerifyMessage ? 409 : 400,
			}
		} else if (candidatePhone?.id) {
			if (candidatePhone.is_verify)
				return {
					message: errorEmailMessage,
					status: 400,
				}

			if (
				now.getHours() > candidatePhone.created_at.getHours() &&
				!candidatePhone.is_verify
			) {
				await this.userModel.removeUserModel(candidatePhone.id)

				this.expiresVerify = null
				this.expiresRemoveVerify = null

				return {
					message: this.errorAgainExpireMessage,
					status: 400,
				}
			}

			if (
				(isTimeCheck && isTimeRemoveCheck && !candidatePhone.is_verify) ||
				this.expiresRemoveVerify === null
			) {
				await this.userModel.removeUserModel(candidatePhone.id)

				this.expiresVerify = null
				this.expiresRemoveVerify = null

				return {
					message: this.errorAgainExpireMessage,
					status: 400,
				}
			}

			if (
				(isTimeCheck && !candidatePhone.is_verify) ||
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
					: errorPhoneMessage
			)

			return {
				message: isExpireVerifyMessage
					? this.expireMessage
					: isRemoveExpireVerifyMessage
					? this.errorAgainExpireMessage
					: errorEmailMessage,
				status: isExpireVerifyMessage ? 409 : 400,
			}
		}

		const hasPass = await bcrypt.hash(String(dto.password), 10)
		const { activationLink, resetPassLink } = genLinks(uuidV4)

		const newDto = { ...dto, password: hasPass }

		const newUser = await this.model.createUserModel(
			newDto,
			activationLink,
			resetPassLink
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

		const resultEmail = await authEmailService.sendLink(
			dto.email,
			'Verify account',
			renderHtml
		)

		if (typeof resultEmail === 'undefined' || typeof resultEmail === 'string')
			return {
				message: 'Error sending email, please repaid sending!',
				status: 400,
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

		console.log(this.expiresVerify)

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
	async repaidVerifyAccountSendEmail(
		dto: RepaidVerifyDto
	): TypeAuthServiceMessageWithApiError {
		if (!APP_CONFIG.API_URL)
			return {
				message: 'App config is not set api-url',
				status: 500,
			}

		const now = new Date()
		const errorEmailMessage = `A user with email ${dto.email} already exists.`
		const repaidExpireMessage = `Please confirm your account verify the link, you have 2 minutes to do this.`

		const isTimeCheck =
			this.expiresVerify !== null &&
			now.getTime() >= this.expiresVerify.getTime()

		if (
			!isTimeCheck &&
			!this.isFirstSendEmailVerifyAccount &&
			this.expiresVerify !== null
		) {
			return ApiError.BadRequest('Expire time verify is not completed')
		}

		if (
			isTimeCheck &&
			!this.isFirstSendEmailVerifyAccount &&
			this.expiresVerify !== null
		) {
			this.expiresVerify = null

			this.isFirstSendEmailVerifyAccount = true

			return ApiError.BadRequest('Expire verify time that all')
		}

		const user = await this.model.getUserByEmail(dto.email)

		if (!user) return ApiError.NotFound('User is not founded!')

		if (user.is_verify)
			return ApiError.BadRequest('User have been success verify')

		const link = activationLinkHandler(APP_CONFIG.API_URL, user.activation_link)
		const renderHtml = renderSendActivationLink(link, 'активировать аккаунт')
		const resultEmail = await authEmailService.sendLink(
			dto.email,
			'Verify account',
			renderHtml
		)

		if (typeof resultEmail === 'undefined' || typeof resultEmail === 'string')
			return ApiError.BadRequest('Error sending email')

		if (this.expiresVerify === null) {
			this.expiresVerify = setMinuteUtil(2)
		}

		this.isFirstSendEmailVerifyAccount = false

		return {
			message: !isTimeCheck ? repaidExpireMessage : errorEmailMessage,
			status: !isTimeCheck ? 409 : 400,
		}
	}

	// Reset-password
	async forgetPasswordSendLink(
		dto: RepaidVerifyDto
	): TypeAuthServiceMessageWithApiError {
		if (!APP_CONFIG.API_URL)
			return {
				message: 'App config is not set api-url',
				status: 500,
			}

		const now = new Date()
		const resetPassExpireMessage = `Please confirm your reset-password verify the link, you have 2 minutes to do this.`

		const isTimeCheck =
			this.expiresForgetVerify !== null &&
			now.getTime() >= this.expiresForgetVerify.getTime()

		if (
			!isTimeCheck &&
			!this.isFirstSendEmailForgetPassword &&
			this.expiresForgetVerify !== null
		) {
			return ApiError.BadRequest('The password reset has not expired.')
		}

		if (
			isTimeCheck &&
			!this.isFirstSendEmailForgetPassword &&
			this.expiresForgetVerify !== null
		) {
			this.expiresForgetVerify = null

			this.isFirstSendEmailForgetPassword = true

			return ApiError.BadRequest('Expire reset verify time that all')
		}

		const user = await this.model.getUserByEmail(dto.email)

		if (!user || !user.id) return ApiError.NotFound('User is not founded!')

		const resetLink = resetPassLinkHandler(
			APP_CONFIG.API_URL,
			user.reset_pass_link
		)
		const renderHtml = renderSendActivationLink(resetLink, 'сброс пароль')
		const resultEmail = await authEmailService.sendLink(
			dto.email,
			'Reset-password',
			renderHtml
		)

		if (typeof resultEmail === 'undefined' || typeof resultEmail === 'string')
			return ApiError.BadRequest('Error sending email')

		if (this.expiresForgetVerify === null) {
			this.expiresForgetVerify = setMinuteUtil(this.maxAgeResetVerify)
		}

		this.isFirstSendEmailForgetPassword = false

		return {
			message: !isTimeCheck
				? resetPassExpireMessage
				: 'The password reset has expired!',
			status: !isTimeCheck ? 409 : 400,
		}
	}

	async forgetPasswordVerify(
		resetLink: string | null | undefined
	): TypeAuthServiceMessageWithApiError {
		if (!resetLink || typeof resetLink === 'undefined')
			return ApiError.BadRequest('User not have link')

		const now = new Date()
		const isTimeCheck =
			this.expiresForgetVerify !== null &&
			now.getTime() >= this.expiresForgetVerify.getTime()
		const { resetPassLink } = genLinks(uuidV4)
		const dto = (value: boolean) => ({ resetLink, isEnableResetPass: value })

		const isVerifyForgetUser = await this.model.forgetVerifyModel(dto(true))

		if (
			(isVerifyForgetUser && !isVerifyForgetUser.enable_reset_pass) ||
			typeof isVerifyForgetUser === 'boolean'
		)
			return ApiError.BadRequest('Bad-request invalid link')

		if (isTimeCheck || this.expiresForgetVerify === null) {
			await this.model.forgetVerifyModel(dto(false))
			const updateUserResetLink = await this.model.updateResetLink(
				isVerifyForgetUser.id,
				resetPassLink
			)

			if (!updateUserResetLink)
				return ApiError.InternalServer('Error user from update reset-link')

			this.expiresForgetVerify = null
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
		const isTimeCheck =
			this.expiresForgetVerify !== null &&
			now.getTime() >= this.expiresForgetVerify.getTime()
		const { resetPassLink } = genLinks(uuidV4)
		const user = await this.model.getUserByEmail(dto.email)

		if (!user || !user.id) return ApiError.NotFound('User not founded')

		if (!user.enable_reset_pass || this.expiresForgetVerify === null)
			return ApiError.BadRequest('User is not verify enable-reset password')

		if (isTimeCheck && !this.isFirstSendEmailForgetPassword) {
			const initUserResetLink = await this.model.updateResetLink(
				user.id,
				resetPassLink
			)
			const initUserState = await this.model.resetUpdateUserPassword(user.id, {
				isEnableResetPass: false,
				newPassword: user.password,
			})

			if (!initUserResetLink)
				return ApiError.InternalServer(
					'Error user from update set new-password reset-link'
				)

			if (!initUserState)
				return ApiError.InternalServer(
					'Error user from time-check set new-password'
				)

			this.expiresForgetVerify = null
			this.isFirstVerifyForgetPassword = true

			return ApiError.BadRequest('The verify for forget password expired!')
		}

		if (typeof dto.newPassword !== 'string')
			return {
				message: 'New password must be string',
				status: 400,
			}

		const hashPass = await bcrypt.hash(dto.newPassword, 10)

		const newUserProfile = await this.model.setNewPasswordMode(
			{ ...dto, newPassword: hashPass },
			user.enable_reset_pass,
			user.id
		)
		const newUserResetLink = await this.model.updateResetLink(
			user.id,
			resetPassLink
		)
		const initUserEnablePass = await this.model.updateEnableResetPass(
			false,
			user.id
		)

		if (!newUserProfile.user || !newUserResetLink || !initUserEnablePass)
			return ApiError.InternalServer('Error from set new password')

		return {
			message: `User have success updated password`,
			status: 201,
		}
	}
}
