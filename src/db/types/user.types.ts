import type { ROLES } from '../../app/roles'
import type { ISharedModelApp } from '../../shared/types/db/app.interface'

export interface IUser extends ISharedModelApp {
	first_name: string
	last_name: string
	email: string
	phone: string
	password: string
	avatar: string
	role: typeof ROLES
	activation_link: string
	is_verify: boolean
}
