import type { IErrorResponseApp } from '../../common/types/db/app.interface'
import type { UserDto } from '../dto/user.dto'

export interface IAuthUserService {
	accessToken: string | { message: string }
	user: UserDto
	message: string
	status: number
}

export type TypeAuthUserService = Promise<Partial<IAuthUserService>>

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
