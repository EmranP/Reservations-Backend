import type { IUser } from '../../app/db/types/user.types'
import type { ROLES } from '../../app/roles'
import type { IResponseGoogleApi } from '../../auth/types/api.types'

export interface IUserDto {
	id: string
	firstName: string
	lastName: string | null
	email: string
	phone: string
	picture: string | null
	role: typeof ROLES
	isVerify: boolean
	resetPassLink: string | undefined
	enableResetPass: boolean
	enableTwoFactoryChallenge: boolean
	createdAt: string | Date
	updatedAt: string | Date
}

export interface IUserGoogleDto {
	accessToken: string
	expiresIn: number
	refreshToken: string
	scope: string
	tokenType: string
	idToken: string
}

export class UserDto {
	id: string | undefined
	firstName: string | undefined
	lastName: string | null | undefined
	email: string | undefined
	phone: string | undefined
	picture: string | null | undefined
	role: typeof ROLES | undefined
	isVerify: boolean | undefined
	resetPassLink: string | undefined
	enableResetPass: boolean | undefined
	enableTwoFactoryChallenge: boolean | undefined
	createdAt: string | Date | undefined
	updatedAt: string | Date | undefined

	constructor(model: Partial<IUser>) {
		this.id = model.id
		this.firstName = model.first_name
		this.lastName = model.last_name
		this.email = model.email
		this.phone = model.phone
		this.picture = model.picture
		this.role = model.role
		this.isVerify = model.is_verify
		this.enableResetPass = model.enable_reset_pass
		this.enableTwoFactoryChallenge = model.enable_two_factory_challenge
		this.resetPassLink = model.reset_pass_link
		this.createdAt = model.created_at
		this.updatedAt = model.updated_at
	}

	toPlain(): Partial<IUserDto> {
		return {
			id: this.id,
			firstName: this.firstName,
			lastName: this.lastName,
			email: this.email,
			phone: this.phone,
			picture: this.picture,
			isVerify: this.isVerify,
			enableResetPass: this.enableResetPass,
			enableTwoFactoryChallenge: this.enableTwoFactoryChallenge,
			resetPassLink: this.resetPassLink,
			role: this.role,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		}
	}
}

// ? Maybe change
export class UserGoogleDto {
	accessToken: string | undefined
	expiresIn: number | undefined
	refreshToken: string | undefined
	scope: string | undefined
	tokenType: string | undefined
	idToken: string | undefined

	constructor(data: IResponseGoogleApi) {
		this.accessToken = data.access_token
		this.expiresIn = data.expires_in
		this.refreshToken = data.refresh_token
		this.scope = data.scope
		this.tokenType = data.token_type
		this.idToken = data.id_token
	}

	toPlain(): Partial<IUserGoogleDto> {
		return {
			accessToken: this.accessToken,
			expiresIn: this.expiresIn,
			refreshToken: this.refreshToken,
			scope: this.scope,
			tokenType: this.tokenType,
			idToken: this.idToken,
		}
	}
}
