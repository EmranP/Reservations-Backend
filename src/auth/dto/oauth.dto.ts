import type { IUserDto } from '../../admin/users/types/dto.interface'
import type { IResponseTelegramApi } from '../types/api.types'

// Google
export class OAuthGoogleCallbackDto {
	code: undefined | string
}

export interface IOAuthCallback {
	code: string
	state: string
}

export interface IOAuthGoogleCodeHandler {
	code: string
	client_id: string
	redirect_uri: string
	grant_type: string
}

// Accounts
export interface IUserAccountDto {
	provider: string
	types: string
	accessToken: string | null
	expiresIn: Date | number | null
	refreshIv?: string | null
	refreshTag?: string | null
	refreshToken?: string | null
}

export interface IUserWithoutAccountDto
	extends Pick<
		IUserDto,
		'firstName' | 'email' | 'phone' | 'picture' | 'isVerify'
	> {
	authMethod: string
	password: string
}

// Telegram

export interface IOAuthTelegramCallbackDto {
	user: IResponseTelegramApi
	state: string
	email: string
}
