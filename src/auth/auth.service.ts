import bcrypt from 'bcrypt'
import { v4 as uuidV4 } from 'uuid'
import type { Logger } from 'winston'
import { AuthModel } from './auth.model'
import type { LoginDto } from './dto/login.dto'
import type { RegistrationDto } from './dto/registration.dto'
import { UserDto } from './dto/user.dto'
import type { TokenService } from './token/token.service'
import type { TypeAuthUserService } from './types/auth.types'

export class AuthService {
	constructor(
		private model: AuthModel,
		private tokenService: TokenService,
		private logger: Logger
	) {}

	async loginEmail(dto: LoginDto): TypeAuthUserService {
		const userEmail = await this.model.getUserByEmail(dto.email)
		this.logger.info('login-email')
		this.logger.debug(userEmail)

		if (!userEmail || !userEmail.id)
			return { message: 'User email not founded', status: 404 }

		const isPassEquals = await bcrypt.compare(
			String(dto.password),
			userEmail?.password
		)

		if (!isPassEquals) return { message: 'Password is not right', status: 400 }

		const userDto = new UserDto(userEmail)
		// const token = tokenService.generateRSToken({ ...userDto })

		return {
			user: userDto,
			// accessToken: token?.accessToken,
		}
	}

	async loginPhone(dto: LoginDto): TypeAuthUserService {
		const userPhone = await this.model.getUserByPhone(dto.phone)
		this.logger.info('login-phone')
		this.logger.debug(userPhone)

		if (!userPhone || !userPhone.id)
			return { message: 'User phone not founded', status: 404 }

		const isPassEquals = await bcrypt.compare(
			String(dto.password),
			userPhone.password
		)

		if (!isPassEquals) return { message: 'Password is not right', status: 400 }

		const userDto = new UserDto(userPhone)

		return {
			user: userDto,
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

		// Add mail service

		// Add tokens service
		const userDto = new UserDto(newUser)

		return {
			user: userDto,
		}
	}

	async logout() {}

	async verifyEmail() {}

	async forgetPassword() {}
}
