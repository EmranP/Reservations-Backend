import { SignJWT } from 'jose'
import type { Logger } from 'winston'
import { getPrivateKey } from '../../common/utils/app/getKeys.utils'
import type { IUserDto } from '../dto/login.dto'
import type { TokenModel } from './token.model'

export class TokenService {
	private accessExpire = process.env.JWT_ACCESS_EXPIRES
	private refreshExpire = process.env.JWT_REFRESH_EXPIRES
	private kidJwks = process.env.KID
	private issuerApp = process.env.ISSUER
	private audienceApp = process.env.AUDIENCE

	constructor(private tokenModel: TokenModel, private logger: Logger) {}

	private async createAccessToken(user: Pick<IUserDto, 'id' | 'role'>) {
		if (
			!this.kidJwks ||
			!this.issuerApp ||
			!this.audienceApp ||
			!this.accessExpire
		)
			return

		const privateKey = await getPrivateKey()
		const now = Math.floor(Date.now() / 1000)
		const jwt = await new SignJWT({
			sub: user.id,
			role: user.role,
			type: 'access',
		})
			.setProtectedHeader({ alg: 'RS256', kid: this.kidJwks })
			.setIssuer(this.issuerApp)
			.setAudience(this.audienceApp)
			.setIssuedAt(now)
			.setExpirationTime(this.accessExpire)
			.sign(privateKey)

		this.logger.info(jwt)

		return jwt
	}

	// CreateRefresh in to token model
	private async createRefreshToken(user: Pick<IUserDto, 'id' | 'role'>) {
		if (
			!this.refreshExpire ||
			!this.kidJwks ||
			!this.issuerApp ||
			!this.audienceApp
		)
			return

		const privateKey = await getPrivateKey()
		const jwt = await new SignJWT({
			sub: user.id,
			role: user.role,
			type: 'refresh',
		})
			.setProtectedHeader({ alg: 'RS256' })
			.setIssuer(this.issuerApp)
			.setAudience(this.audienceApp)
			.setIssuedAt()
			.setExpirationTime(this.refreshExpire)
			.sign(privateKey)

		this.logger.info(jwt)

		return jwt
	}

	async generateTokens() {}

	async verifyRefreshToken() {}

	async saveToken() {}

	async deleteToken() {}
}
