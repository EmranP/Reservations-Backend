import type { IAppService } from '../../common/types/app/app.type'
import type { IErrorResponseApp } from '../../common/types/db/app.interface'
import type { UserDto, UserGoogleDto } from '../../user/dto/user.dto'

export interface IAuthResponseError {
	status: number
	message: string
}

export interface IAuthUserService extends IAppService {
	accessToken: string | { message: string }
	refreshToken: string | { message: string }
	user: UserDto
	expireRefreshTokenAt?: Date
}

export type TypeAuthUserService = Promise<Partial<IAuthUserService>>

export type TypeAuthServiceMessageWithApiError = Promise<
	IAuthResponseError & {
		isTimeCheck?: boolean
		code?: number
	}
>

export type TypeAuthTwoFactoryService = Promise<
	IAuthResponseError | { code: number | null; expireCode: Date | null }
>

export type TypeAuthTokenServiceFindOne = Promise<
	| {
			message: string
			id?: undefined
			refresh_token?: undefined
	  }
	| {
			id: string
			refresh_token: string
			message?: undefined
	  }
	| null
>

export interface IGenerateTokenService {
	access: string | Pick<IErrorResponseApp, 'message'>
	refresh: string | Pick<IErrorResponseApp, 'message'>
}

export interface IUserOAuthGoogle {
	user: UserGoogleDto
	accessToken: string
	refreshToken: string | null
	expiresIn: Date
}
