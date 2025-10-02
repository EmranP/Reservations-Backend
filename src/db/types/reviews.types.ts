import type { IAppData } from '../../shared/types/app/app.interface'

export interface IReviews extends IAppData {
	user_id: number
	room_id: number
	review: string
}
