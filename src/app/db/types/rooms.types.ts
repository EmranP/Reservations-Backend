import type { ISharedModelApp } from '../../../common/types/db/app.interface'
import type { STATUS_ROOM } from '../../enums'

export interface IRooms extends ISharedModelApp {
	price: number
	quality: string
	description: string
	status: typeof STATUS_ROOM
	picture: string
	expire_picture_url: Date | null
}

export interface IOccupiedRooms extends ISharedModelApp {
	user_id: number
	room_id: number
	status: typeof STATUS_ROOM | 'BUYS'
	total_price: number
	residence_time: Date
}
