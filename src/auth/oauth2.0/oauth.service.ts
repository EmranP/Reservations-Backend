import { jwtVerify, type JWTVerifyGetKey } from 'jose'
import { UserDto } from '../../admin/users/dto/user.dto'
import type { IUser } from '../../app/db/types/user.types'
import { BaseConfig } from '../../common/abstract/base-config.common'
import type { IAppEnCrypto } from '../../common/types/app/app.type'
import type { IErrorResponseApp } from '../../common/types/db/app.interface'
import { setDateUtil } from '../../common/utils/app/date.util'
import { ApiError } from '../../common/utils/log/exists-error.log'
import type { IUserAccountDto, IUserWithoutAccountDto } from '../dto/oauth.dto'
import type { TokenService } from '../token/token.service'
import type { IUserOAuth } from '../types/types.auth'
import type { OAuthModel } from './oauth.model'

export class OAuthService extends BaseConfig {
	public async getOauthUrl(
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

	protected async verifyOAuthToken<T>(
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

	protected async updateOAuth(
		model: OAuthModel,
		tokenService: TokenService,
		resetPassLink: string,
		user: IUser,
		dataDto: IUserAccountDto & IUserWithoutAccountDto,
		state: string
	): Promise<ApiError | IUserOAuth> {
		const updateUser = await model.updateUserOAuth(
			user.id,
			resetPassLink,
			dataDto
		)

		if (!updateUser?.id || !updateUser)
			return ApiError.InternalServer('Error from update account and user!')

		const userDto = new UserDto(updateUser)

		if (
			!userDto.id ||
			typeof userDto.role === 'undefined' ||
			userDto.role === null
		)
			return ApiError.InternalServer(
				`Error transform user-${dataDto.provider} dto`
			)

		const tokens = await tokenService.generateTokens({
			id: userDto.id,
			role: userDto.role,
		})

		if (
			!tokens.refresh ||
			typeof tokens.refresh !== 'string' ||
			typeof tokens.access !== 'string'
		)
			return ApiError.InternalServer('Error refresh-token is not generate')

		const expireRefreshTokenAt = setDateUtil(this.maxAgeRefresh)
		const newSession = await tokenService.saveToken(
			userDto.id,
			tokens.refresh,
			expireRefreshTokenAt,
			state
		)

		if (
			typeof newSession === 'object' &&
			newSession !== null &&
			'message' in newSession
		)
			return ApiError.InternalServer(newSession.message)

		return {
			user: userDto,
			accessToken: tokens.access,
			refreshToken: tokens.refresh,
			expiresIn: expireRefreshTokenAt,
		}
	}

	protected async createOAuth(
		model: OAuthModel,
		tokenService: TokenService,
		dataCreateDto: IUserAccountDto & IUserWithoutAccountDto,
		resetPassLink: string,
		authMethod: string,
		state: string,
		refreshHash?: IAppEnCrypto | null
	) {
		const refreshNewValue =
			typeof refreshHash?.encrypted === 'string' ? refreshHash.encrypted : null

		const newUser = await model.createUserOAuth(resetPassLink, authMethod, {
			...dataCreateDto,
			refreshToken:
				dataCreateDto.provider === 'github'
					? dataCreateDto.refreshToken
					: refreshNewValue,
		})

		if (!newUser)
			return ApiError.InternalServer(
				'Error from create user-account with google'
			)

		const userDto = new UserDto(newUser)

		if (
			!userDto.id ||
			typeof userDto.role === 'undefined' ||
			userDto.role === null
		)
			return ApiError.BadRequest('User google dto not found!')

		const tokens = await tokenService.generateTokens({
			id: userDto.id,
			role: userDto.role,
		})

		if (
			!tokens.refresh ||
			typeof tokens.refresh !== 'string' ||
			typeof tokens.access !== 'string'
		)
			return ApiError.InternalServer('Error refresh-token is not generate')

		const expireRefreshTokenAt = setDateUtil(this.maxAgeRefresh)
		const newSession = await tokenService.saveToken(
			userDto.id,
			tokens.refresh,
			expireRefreshTokenAt,
			state
		)

		if (
			typeof newSession === 'object' &&
			newSession !== null &&
			'message' in newSession
		)
			return ApiError.InternalServer(newSession.message)

		return {
			user: userDto,
			accessToken: tokens.access,
			refreshToken: tokens.refresh,
			expiresIn: expireRefreshTokenAt,
		}
	}
}
