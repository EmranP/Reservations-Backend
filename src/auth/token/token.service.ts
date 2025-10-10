import { SignJWT } from 'jose'
import type { IUserDto } from '../../../dto/auth/login.dto'
import { getPrivateKey } from '../../../utils/app/getKeys.utils'

class TokenService {
	private accessExpire = process.env.JWT_ACCESS_EXPIRES
	private refreshExpire = process.env.JWT_REFRESH_EXPIRES
	private kidJwks = process.env.KID

	async createAccessToken(user: Pick<IUserDto, 'id' | 'role'>) {
		const privateKey = await getPrivateKey()
		const now = Math.floor(Date.now() / 1000)
		const jwt = await new SignJWT({ sub: user.id, role: user.role })
	}

	async createRefreshToken() {}

	async verifyRefreshToken() {}

	async saveToken() {}

	async deleteToken() {}
}

export const tokenService = new TokenService()
