import bcrypt from 'bcrypt'
import { UserDto } from '../../dto/auth/login.dto'
import type { LoginDto } from './auth.dto'
import { authLoginModel } from './auth.model'
export class AuthService {
	async login(dto: LoginDto) {
		const user = await authLoginModel(dto)

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

export const authService = new AuthService()
