import type { IAppService } from '../../common/types/app/app.type'
import type { IErrorResponseApp } from '../../common/types/db/app.interface'
import type { ApiError } from '../../common/utils/log/exists-error.log'
import type { UserDto } from '../../user/dto/user.dto'

export interface IAuthUserService extends IAppService {
	accessToken: string | { message: string }
	refreshToken: string | { message: string }
	user: UserDto
}

export type TypeAuthUserService = Promise<Partial<IAuthUserService>>

export type TypeAuthServiceMessageWithApiError = Promise<
	| ApiError
	| {
			message: string
	  }
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
