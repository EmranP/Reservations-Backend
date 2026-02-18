import type { IOrders } from '../../../app/db/types/orders.types'
import type { IPayment } from '../../../app/db/types/payment.types'
import type { IRooms } from '../../../app/db/types/rooms.types'
import type { IUser, TypeUserClientRes } from '../../../app/db/types/user.types'

export type RedisEntityMapType = {
	room: IRooms[]
	order: IOrders[]
	user: IUser[] | TypeUserClientRes[]
	payment: IPayment[]
}
