import type { IUser } from '../../app/db/types/user.types'
import type { ROLES } from '../../app/roles'

export interface IUserDto {
	id: string
	firstName: string
	lastName: string
	email: string
	phone: string
	avatar: string
	role: typeof ROLES
	isVerify: boolean
	isTwoAuthCode: number | null
	resetPassLink: string | undefined
	enableResetPass: boolean
	createdAt: string | Date
	updatedAt: string | Date
}

export class UserDto {
	id: string | undefined
	firstName: string | undefined
	lastName: string | undefined
	email: string | undefined
	phone: string | undefined
	avatar: string | undefined
	role: typeof ROLES | undefined
	isVerify: boolean | undefined
	isTwoAuthCode: number | null | undefined
	resetPassLink: string | undefined
	enableResetPass: boolean | undefined
	createdAt: string | Date | undefined
	updatedAt: string | Date | undefined

	constructor(model: Partial<IUser>) {
		this.id = model.id
		this.firstName = model.first_name
		this.lastName = model.last_name
		this.email = model.email
		this.phone = model.phone
		this.avatar = model.avatar
		this.role = model.role
		this.isVerify = model.is_verify
		this.enableResetPass = model.enable_reset_pass
		this.resetPassLink = model.reset_pass_link
		this.isTwoAuthCode = model.is_two_auth_code
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
			avatar: this.avatar,
			isVerify: this.isVerify,
			enableResetPass: this.enableResetPass,
			resetPassLink: this.resetPassLink,
			isTwoAuthCode: this.isTwoAuthCode,
			role: this.role,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		}
	}
}
