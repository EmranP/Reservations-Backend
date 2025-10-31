import bcrypt from 'bcrypt'
import type { Logger } from 'winston'
import { AuthModel } from './auth.model'
import { UserDto, type LoginDto } from './dto/login.dto'
import type { TokenService } from './token/token.service'

export class AuthService {
	constructor(
		private model: AuthModel,
		private tokenService: TokenService,
		private logger: Logger
	) {}

	async login(dto: LoginDto) {
		const user = await this.model.loginModel(dto)

		if (!user || !user.id) return { message: 'User not founded', status: 404 }

		if (typeof dto.password !== 'string')
			return { message: 'Password is must be the string' }

		const isPassEquals = await bcrypt.compare(dto.password, user.password)

		// if (!isPassEquals) return { message: 'Password is not right', status: 400 }

		const userDto = new UserDto(user)
		// const token = tokenService.generateRSToken({ ...userDto })

		return {
			user: userDto,
			// accessToken: token?.accessToken,
		}
	}

	async registration() {}

	async logout() {}

	async verifyEmail() {}

	async forgetPassword() {}
}
