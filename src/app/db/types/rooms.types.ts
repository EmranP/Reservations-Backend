import type { ISharedModelApp } from '../../../common/types/db/app.interface'
import type { STATUS_ROOM } from '../../enums'

export interface IRooms extends ISharedModelApp {
	price: number
	quality: number
	description: string
	status: typeof STATUS_ROOM
	image_url: string
}

export interface IOccupiedRooms extends ISharedModelApp {
	user_id: number
	room_id: number
	status: typeof STATUS_ROOM | 'BUYS'
	total_price: number
	residence_time: Date
}
