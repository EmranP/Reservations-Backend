import type { ROLES } from '../../../app/roles'
import type { ISharedModelApp } from './app.types'

export interface IUser extends ISharedModelApp {
	first_name: string
	last_name: string
	phone: string
	role: typeof ROLES
	activation_link: string
}
