import type { ISharedModelApp } from '../../../common/types/db/app.interface'

export interface IRooms extends ISharedModelApp {
	price: number
	quality: number
	description: string
	image_url: string
}

export interface IOccupiedRooms extends ISharedModelApp {
	user_id: number
	room_id: number
	total_price: number
	residence_time: Date
}
