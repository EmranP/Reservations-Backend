import type { ISharedModelApp } from '../../../common/types/db/app.interface'

export interface IReviews extends ISharedModelApp {
	user_id: string
	room_id: string
	review: string | null
	rating: number
}
