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
	refreshToken: string
	expiresIn: number
}

export interface ICreateUserWithoutAccountDto
	extends Pick<
		IUserDto,
		'firstName' | 'email' | 'phone' | 'picture' | 'isVerify'
	> {
	authMethod: string
	activationLink: string
	password: string
}
