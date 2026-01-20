import type { IPaginationConfig } from '../../common/types/app/app.type'
import type { IRooms } from '../../common/types/db/rooms.types'

export interface IGetAllRoomsWithMeta {
	data: IRooms[]
	meta: IPaginationConfig
}
