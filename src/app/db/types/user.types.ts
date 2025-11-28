import type { ISharedModelApp } from '../../../common/types/db/app.interface'
import type { ROLES } from '../../roles'

export interface IUser extends ISharedModelApp {
	first_name: string
	last_name: string
	email: string
	phone: string
	password: string
	avatar: string
	role: typeof ROLES
	activation_link: string
	reset_pass_link: string
	enable_reset_pass: boolean
	is_verify: boolean
	is_two_auth_code: number | null
}
