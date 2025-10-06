import type { ROLES } from '../../app/roles'
import type { IAppData } from '../../shared/types/app/app.interface'

export interface IUser extends IAppData {
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
