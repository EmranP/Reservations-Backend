import type { IRooms } from '../../app/db/types/rooms.types'
import type { STATUS_ROOM } from '../../app/enums'
import type { IAppSharedDto } from '../../common/types/app/app.type'

export interface IRoomDto extends IAppSharedDto {
	price: number | undefined
	quality: string | undefined
	description: string | undefined
	status: typeof STATUS_ROOM | undefined
	picture: string | null | undefined
}

export class RoomDto {
	id: string
	price: number | undefined
	quality: string | undefined
	description: string | undefined
	status: typeof STATUS_ROOM | undefined
	picture: string | null | undefined
	createdAt: Date
	updatedAt: Date

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

	public toPlain(): IRoomDto {
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
