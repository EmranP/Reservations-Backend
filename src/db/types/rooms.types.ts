import type { IAppData } from '../../common/types/app/app.interface'

export interface IRooms extends IAppData {
	price: number
	quality: number
	description: string
	image_url: string
}

export interface IOccupiedRooms extends IAppData {
	user_id: number
	room_id: number
	total_price: number
	residence_time: Date
}
