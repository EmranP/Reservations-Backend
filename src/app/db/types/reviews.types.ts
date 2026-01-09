import type { ISharedModelApp } from '../../../common/types/db/app.interface'

export interface IReviews extends ISharedModelApp {
	user_id: number
	room_id: number
	review: string
}
