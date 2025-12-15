import type { IUserDto } from '../../user/dto/user.dto'

// Google
export class OAuthGoogleCallbackDto {
	code: undefined | string
}

export interface IOAuthGoogleCallback {
	code: string
}

export interface IOAuthGoogleCodeHandler {
	code: string
	client_id: string
	redirect_uri: string
	grant_type: string
}

export interface ICreateUserAccountDto {
	provider: string
	types: string
	accessToken: string
	expiresIn: Date | number
	googleRefreshIv?: string | null
	googleRefreshTag?: string | null
	refreshToken?: string | null
}

export interface ICreateUserWithoutAccountDto
	extends Pick<
		IUserDto,
		'firstName' | 'email' | 'phone' | 'picture' | 'isVerify'
	> {
	authMethod: string
	password: string
}
