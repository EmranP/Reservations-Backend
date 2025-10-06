import jwt from 'jsonwebtoken'
import type { StringValue } from 'ms'
import type { IGenerateToken, ITokenPayload } from './token.type'

export class TokenService {
	private secretAccessKey = process.env.JWT_ACCESS_SECRET || null
	private secretRefreshKey = process.env.JWT_REFRESH_SECRET || null
	// EXPIRES Token
	private expiresAccessKey = process.env.JWT_ACCESS_EXPIRES || null
	private expiresRefreshKey = process.env.JWT_REFRESH_EXPIRES || null

	generateToken(payload: ITokenPayload | null): IGenerateToken | null {
		if (
			!this.expiresAccessKey ||
			!this.secretAccessKey ||
			!this.secretRefreshKey ||
			!this.expiresRefreshKey
		)
			return null

		if (!payload) return null

		const accessToken = jwt.sign(
			{ sub: payload.userId, role: payload.role },
			this.secretAccessKey,
			{
				algorithm: 'RS256',
				expiresIn: this.expiresAccessKey as StringValue,
			}
		)
		const refreshToken = jwt.sign(
			{ sub: payload.userId, role: payload.role },
			this.secretRefreshKey,
			{ algorithm: 'RS256', expiresIn: this.expiresRefreshKey as StringValue }
		)

		return {
			accessToken,
			refreshToken,
		}
	}

	verifyToken(token: string | null) {
		if (!token || !this.secretAccessKey) return null

		const verifyToken = jwt.verify(token, this.secretAccessKey)

		console.log(verifyToken)

		return verifyToken
	}
}
