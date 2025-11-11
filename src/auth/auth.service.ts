import bcrypt from 'bcrypt'
import { v4 as uuidV4 } from 'uuid'
import type { Logger } from 'winston'
import { isVerifyTokenError } from '../common/utils/app/checkType.utils'
import { ApiError } from '../common/utils/log/exists-error.log'
import { UserDto } from '../user/dto/user.dto'
import { AuthModel } from './auth.model'
import type { LoginDto } from './dto/login.dto'
import type { RegistrationDto } from './dto/registration.dto'
import type { TokenService } from './token/token.service'
import type { TypeAuthUserService } from './types/types.auth'

export class AuthService {
	constructor(
		private model: AuthModel,
		private tokenService: TokenService,
		private logger: Logger
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
		// Candidate
		const candidateEmail = await this.model.getUserByEmail(dto.email)
		const candidatePhone = await this.model.getUserByPhone(dto.phone)
		// Message
		const errorEmailMessage = `A user with email ${dto.email} already exists.`
		const errorPhoneMessage = `A user with phone ${dto.phone} already exists.`

		if (candidateEmail?.id) {
			this.logger.info(errorEmailMessage)

			return {
				message: errorEmailMessage,
				status: 409,
			}
		} else if (candidatePhone?.id) {
			this.logger.info(errorPhoneMessage)

			return {
				message: errorPhoneMessage,
				status: 409,
			}
		}

		const hasPass = await bcrypt.hash(String(dto.password), 10)
		const activationLink = uuidV4()

		const newDto = { ...dto, password: hasPass }

		const newUser = await this.model.createUserModel(newDto, activationLink)

		if (!newUser?.id) return { message: 'Error is not created', status: 500 }

		//! Add mail service

		const userDto = new UserDto(newUser)
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

	async logout() {}

	async verifyEmail() {}

	async forgetPassword() {}
}
