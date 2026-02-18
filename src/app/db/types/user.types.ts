import type { AUTH_METHOD } from '../../../common/constants/enum.constant'
import type { ISharedModelApp } from '../../../common/types/db/app.interface'
import type { ROLES } from '../../enums'

export interface IUser extends ISharedModelApp {
	first_name: string
	last_name: string
	email: string
	phone: string
	password: string
	picture: string
	expire_picture_url: Date | null
	role: typeof ROLES
	activation_link: string
	reset_pass_link: string
	is_verify: boolean
	enable_reset_pass: boolean
	enable_two_factory_challenge: boolean
	method: typeof AUTH_METHOD
}

export type TypeReturnUpdateOAuthUser = Pick<
	IUser,
	| 'id'
	| 'first_name'
	| 'email'
	| 'phone'
	| 'role'
	| 'picture'
	| 'is_verify'
	| 'created_at'
	| 'updated_at'
>

export type TypeUserID = Pick<IUser, 'id'>
export type TypeUserIDWithRole = Pick<IUser, 'id' | 'role'>
export type TypeUserClientRes = Omit<
	IUser,
	| 'password'
	| 'activation_link'
	| 'reset_pass_link'
	| 'enable_two_factory_challenge'
	| 'enable_reset_pass'
>

export type ReturnCreateUserType = Omit<
	IUser,
	| 'reset_pass_link'
	| 'created_at'
	| 'updated_at'
	| 'enable_two_factory_challenge'
	| 'enable_reset_pass'
>
