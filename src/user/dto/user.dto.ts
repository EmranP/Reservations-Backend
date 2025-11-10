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
	createdAt: string | Date
	updatedAt: string | Date
}

export class UserDto {
	id: string
	firstName: string
	lastName: string
	email: string
	phone: string
	avatar: string
	role: typeof ROLES
	isVerify: boolean
	createdAt: string | Date
	updatedAt: string | Date

	constructor(model: IUser) {
		this.id = model.id
		this.firstName = model.first_name
		this.lastName = model.last_name
		this.email = model.email
		this.phone = model.phone
		this.avatar = model.avatar
		this.role = model.role
		this.isVerify = model.is_verify
		this.createdAt = model.created_at
		this.updatedAt = model.updated_at
	}

	toPlain(): IUserDto {
		return {
			id: this.id,
			firstName: this.firstName,
			lastName: this.lastName,
			email: this.email,
			phone: this.phone,
			avatar: this.avatar,
			isVerify: this.isVerify,
			role: this.role,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		}
	}
}
