import type { ISharedModelApp } from '../../../common/types/db/app.interface'

export interface IOrders extends ISharedModelApp {
	user_id: string
	room_id: string
	total_price: string
	residence_time: Date
}
