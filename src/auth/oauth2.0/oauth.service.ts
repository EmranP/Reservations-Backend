import { jwtVerify, type JWTVerifyGetKey } from 'jose'
import type { IErrorResponseApp } from '../../common/types/db/app.interface'
import { ApiError } from '../../common/utils/log/exists-error.log'
import { AuthBaseConfig } from '../abstract/auth-config.base'

export class OAuthService extends AuthBaseConfig {
	async getOauthUrl(
		state: string | undefined,
		clientId: string | undefined,
		clientSecret: string | undefined,
		clientRedirect: string | undefined,
		genLinkHandler: (
			clientIdHandler: string | undefined,
			clientRedirectHandler: string | undefined,
			stateHandler: string | undefined
		) => string
	): Promise<ApiError | string> {
		if (!state)
			return ApiError.BadRequest('State is not have maybe CSRF attack!!')

		if (!clientId || !clientSecret || !clientRedirect)
			return ApiError.InternalServer('Google oauth  not set the config!')

		const url = genLinkHandler(clientId, clientRedirect, state)

		return url
	}

	async verifyOAuthToken<T>(
		token: string | undefined,
		publicJwks: JWTVerifyGetKey,
		algorithms: string[] = ['RS256'],
		issuer: string
	): Promise<IErrorResponseApp | T> {
		if (!token)
			return {
				message: 'ID token is not have!',
				status: 404,
			}

		const account = await jwtVerify<T>(token, publicJwks, {
			algorithms,
			issuer,
		})

		if (!account || !account.payload)
			return {
				message: 'Error from verify-account github',
				status: 400,
			}

		return account.payload
	}
}
