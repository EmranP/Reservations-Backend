import type { AUTH_METHOD } from '../../../common/constants/enum.constant'
import type { ISharedModelApp } from '../../../common/types/db/app.interface'
import type { ROLES } from '../../roles'

export interface IUser extends ISharedModelApp {
	first_name: string
	last_name: string
	email: string
	phone: string
	password: string
	picture: string
	role: typeof ROLES
	activation_link: string
	reset_pass_link: string
	is_verify: boolean
	enable_reset_pass: boolean
	enable_two_factory_challenge: boolean
	method: typeof AUTH_METHOD
}
