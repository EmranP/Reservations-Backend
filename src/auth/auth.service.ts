import bcrypt from 'bcrypt'
import { v4 as uuidV4 } from 'uuid'
import type { Logger } from 'winston'
import { APP_CONFIG } from '../common/config/app.config'
import { activationLinkHandler } from '../common/constants/link.constant'
import { isVerifyTokenError } from '../common/utils/app/checkType.utils'
import { setMinuteUtil } from '../common/utils/app/date.util'
import { renderSendActivationTwoFactoryAuth } from '../common/utils/format/render.util'
import { ApiError } from '../common/utils/log/exists-error.log'
import { UserDto } from '../user/dto/user.dto'
import type { UserModel } from '../user/user.model'
import { AuthModel } from './auth.model'
import type { LoginDto } from './dto/login.dto'
import type { RegistrationDto } from './dto/registration.dto'
import { authEmailService } from './index.auth'
import type { TokenService } from './token/token.service'
import type {
	TypeAuthServiceMessageWithApiError,
	TypeAuthUserService,
} from './types/types.auth'

export class AuthService {
	private verifyConfig = APP_CONFIG.EXPIRES_USER_VERIFY
	private maxAgeVerify = this.verifyConfig === '5m' ? 5 : 0
	private expiresVerify = setMinuteUtil(this.maxAgeVerify)
	private errorExpireMessage =
		'Unfortunately, your confirmation time has expired, please register again.'
	private expireMessage =
		'Please confirm your account via the link, you have 5 minutes to do this.'

	constructor(
		protected model: AuthModel,
		private userModel: UserModel,
		protected tokenService: TokenService,
		protected logger: Logger
	) {}

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

		const tokens = await this.tokenService.generateTokens(userDto)

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

		const tokens = await this.tokenService.generateTokens(userDto)

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
		const isTimeCheck = now.getTime() >= this.expiresVerify.getTime()

		// Candidate
		const candidateEmail = await this.model.getUserByEmail(dto.email)
		const candidatePhone = await this.model.getUserByPhone(dto.phone)
		// Message
		const errorEmailMessage = `A user with email ${dto.email} already exists.`
		const errorPhoneMessage = `A user with phone ${dto.phone} already exists.`

		if (candidateEmail?.id) {
			if (isTimeCheck && !candidateEmail.is_verify) {
				await this.userModel.removeUserModel(candidateEmail.id)

				this.expiresVerify = setMinuteUtil(this.maxAgeVerify)

				return {
					message: this.errorExpireMessage,
					status: 400,
				}
			}

			this.logger.info(!isTimeCheck ? this.expireMessage : errorEmailMessage)

			return {
				message: !isTimeCheck ? this.expireMessage : errorEmailMessage,
				status: 409,
			}
		} else if (candidatePhone?.id) {
			if (
				now.getTime() >= this.expiresVerify.getTime() &&
				!candidatePhone.is_verify
			) {
				await this.userModel.removeUserModel(candidatePhone.id)

				this.expiresVerify = setMinuteUtil(this.maxAgeVerify)

				return {
					message: this.errorExpireMessage,
					status: 400,
				}
			}

			this.logger.info(!isTimeCheck ? this.expireMessage : errorPhoneMessage)

			return {
				message: !isTimeCheck ? this.expireMessage : errorPhoneMessage,
				status: 409,
			}
		}

		const hasPass = await bcrypt.hash(String(dto.password), 10)
		const activationLink = uuidV4()

		const newDto = { ...dto, password: hasPass }

		const newUser = await this.model.createUserModel(newDto, activationLink)

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
		const renderHtml = renderSendActivationTwoFactoryAuth(link)

		const resultEmail = await authEmailService.sendLink(
			dto.email,
			'Verify account',
			renderHtml
		)

		if (!resultEmail)
			return {
				message: 'Error sending email',
				status: 400,
			}

		if (!newUser.is_verify)
			return { message: 'Please verify your account', status: 409 }

		return {
			message: 'User has success registration',
			status: 201,
		}
	}

	async refreshToken(refreshToken: string): TypeAuthUserService {
		const isVerifyToken = await this.tokenService.verifyToken(refreshToken)

		if (isVerifyTokenError(isVerifyToken))
			return ApiError.BadRequest(isVerifyToken.message)

		if (!isVerifyToken.sub || !isVerifyToken.role)
			return ApiError.BadRequest('ID or Role is not have from verify token')

		const tokens = await this.tokenService.generateTokens({
			id: isVerifyToken.sub,
			role: isVerifyToken.role,
		})

		if (!tokens.refresh || typeof tokens.refresh !== 'string')
			return ApiError.BadRequest('Error generate token from new-refresh token')

		await this.tokenService.saveToken(isVerifyToken.sub, tokens.refresh)

		return {
			accessToken: tokens.access,
			refreshToken: tokens.refresh,
		}
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

	async verifyAccount(
		activationLink: string | null
	): TypeAuthServiceMessageWithApiError {
		const now = new Date()
		const isTimeCheck = now.getTime() >= this.expiresVerify.getTime()

		if (!activationLink || activationLink === null)
			return ApiError.NotFound('Activation link is must be empty')

		const isVerifyUser = await this.model.verifyModel({ activationLink })

		if (isTimeCheck && isVerifyUser && isVerifyUser.id) {
			await this.userModel.removeUserModel(isVerifyUser.id)

			this.expiresVerify = setMinuteUtil(this.maxAgeVerify)

			return ApiError.BadRequest(this.errorExpireMessage)
		}

		if (isVerifyUser === false || typeof isVerifyUser !== 'undefined')
			return ApiError.BadRequest('Bad-request from verify-account')

		const user = new UserDto(isVerifyUser)

		return {
			message: user.isVerify
				? `The user has success verify account`
				: 'The user has not confirmed the account',
			status: 204,
		}
	}

	async forgetPassword() {}
}
