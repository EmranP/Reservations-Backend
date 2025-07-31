import type { STATUS_ROOM } from '../../../app/status.app'
import type { ISharedModelApp } from './app.types'

export interface IRooms extends ISharedModelApp {
	price: number
	quality: string
	description: string
	status: typeof STATUS_ROOM
	image_url: string
}
