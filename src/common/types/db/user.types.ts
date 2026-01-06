import type { ROLES } from '../../../app/enums'
import type { ISharedModelApp } from './app.interface'

export interface IUser extends ISharedModelApp {
	first_name: string
	last_name: string
	phone: string
	role: typeof ROLES
	activation_link: string
}
