import type { IAppData } from '../../common/types/app/app.interface'

export interface IToken extends Omit<IAppData, 'updated_at'> {
	user_id: number
	refresh_token: string
}
