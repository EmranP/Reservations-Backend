import type { ISharedModelApp } from '../../../common/types/db/app.interface'

export interface IAccounts extends ISharedModelApp {
	user_id: string
	provider: string
	types: string
	access_token: string
	refresh_token: string
	refresh_token_iv: string | null
	refresh_token_tag: string | null
	expires_in: Date | null
}
