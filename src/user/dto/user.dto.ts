import type { IUser } from '../../app/db/types/user.types'
import type { ROLES } from '../../app/roles'

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

export interface IUserGoogleDto
	extends Pick<
		IUserDto,
		| 'firstName'
		| 'email'
		| 'id'
		| 'isVerify'
		| 'lastName'
		| 'phone'
		| 'picture'
		| 'role'
		| 'updatedAt'
		| 'createdAt'
	> {
	accessToken: string
	refreshToken: string
	expiresIn: number
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
	enableResetPass: boolean | undefined
	enableTwoFactoryChallenge: boolean | undefined
	createdAt: string | Date | undefined
	updatedAt: string | Date | undefined

	constructor(data: Partial<IUser>) {
		this.id = data.id
		this.firstName = data.first_name
		this.lastName = data.last_name
		this.email = data.email
		this.phone = data.phone
		this.picture = data.picture
		this.role = data.role
		this.isVerify = data.is_verify
		this.enableResetPass = data.enable_reset_pass
		this.enableTwoFactoryChallenge = data.enable_two_factory_challenge
		this.createdAt = data.created_at
		this.updatedAt = data.updated_at
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
			role: this.role,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		}
	}
}

// ? Maybe change
export class UserGoogleDto {
	id: string | undefined
	firstName: string | undefined
	lastName: string | null | undefined
	email: string | undefined
	phone: string | undefined
	picture: string | null | undefined
	role: typeof ROLES | undefined
	isVerify: boolean | undefined
	enableResetPass: boolean | undefined
	enableTwoFactoryChallenge: boolean | undefined
	createdAt: string | Date | undefined
	updatedAt: string | Date | undefined

	constructor(data: IUser) {
		this.id = data.id
		this.firstName = data.first_name
		this.lastName = data.last_name
		this.email = data.email
		this.phone = data.phone
		this.picture = data.picture
		this.role = data.role
		this.isVerify = data.is_verify
		this.enableResetPass = data.enable_reset_pass
		this.enableTwoFactoryChallenge = data.enable_two_factory_challenge
		this.createdAt = data.created_at
		this.updatedAt = data.updated_at
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
			role: this.role,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		}
	}
}
