import type { ISharedModelApp } from './app.types'

export interface IToken extends Omit<ISharedModelApp, 'updated_at'> {
	user_id: number
	refresh_token: string
}
