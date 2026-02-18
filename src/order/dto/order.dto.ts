import type { IOrders } from '../../app/db/types/orders.types'
import type { STATUS_ORDER } from '../../app/enums'
import type { IAppSharedDto } from '../../common/types/app/app.type'
import type { IOrderDto } from '../types/dto.interface'

export class OrderDto implements IAppSharedDto {
	id: string
	userId: string
	roomId: string
	totalPrice: number
	residenceTime: Date
	status: typeof STATUS_ORDER
	createdAt: Date
	updatedAt: Date

	constructor(data: IOrders) {
		this.id = data.id
		this.userId = data.user_id
		this.roomId = data.room_id
		this.totalPrice = data.total_price
		this.residenceTime = data.residence_time
		this.createdAt = data.created_at
		this.updatedAt = data.updated_at
		this.status = data.status
	}

	public toPlain(): IOrderDto {
		return {
			id: this.id,
			userId: this.userId,
			roomId: this.roomId,
			totalPrice: this.totalPrice,
			residenceTime: this.residenceTime,
			status: this.status,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		}
	}
}
