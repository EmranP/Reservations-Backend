import type { ISharedModelApp } from '../../../common/types/db/app.interface'
import type { STATUS_ORDER } from '../../enums'

export interface IOrders extends ISharedModelApp {
	user_id: string
	room_id: string
	total_price: number
	residence_time: Date
	status: typeof STATUS_ORDER
}
