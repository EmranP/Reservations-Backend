import type { IRooms } from '../../app/db/types/rooms.types'
import type { STATUS_ROOM } from '../../app/enums'

export class IRoomDto {
	id: string | undefined
	price: number | undefined
	quality: string | undefined
	description: string | undefined
	status: typeof STATUS_ROOM | undefined
	picture: string | null | undefined
	createdAt: Date | undefined
	updatedAt: Date | undefined
}

export class RoomDto {
	id: string | undefined
	price: number | undefined
	quality: string | undefined
	description: string | undefined
	status: typeof STATUS_ROOM | undefined
	picture: string | null | undefined
	createdAt: Date | undefined
	updatedAt: Date | undefined

	constructor(data: IRooms) {
		this.id = data.id
		this.price = data.price
		this.quality = data.quality
		this.description = data.description
		this.status = data.status
		this.picture = data.picture
		this.createdAt = data.created_at
		this.updatedAt = data.updated_at
	}

	toPlain(): IRoomDto {
		return {
			id: this.id,
			price: this.price,
			quality: this.quality,
			description: this.description,
			status: this.status,
			picture: this.picture,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		}
	}
}
