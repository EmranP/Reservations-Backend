import type { ISharedModelApp } from '../../../common/types/db/app.interface'

export interface IAccounts extends ISharedModelApp {
	user_id: string
	provider: string
	types: string
	access_token: string
	refresh_token: string
	expires_in: number
}
