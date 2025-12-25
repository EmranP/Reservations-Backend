import type { IUserDto } from '../../user/dto/user.dto'

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

export interface IUserAccountDto {
	provider: string
	types: string
	accessToken: string
	expiresIn: Date | number
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
