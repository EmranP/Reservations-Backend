import type { IRooms } from '../../app/db/types/rooms.types'
import type { IPaginationConfig } from '../../common/types/app/app.type'
import type { TypeAppID } from '../../common/types/db/app.interface'
import type { IRoomDto } from '../dto/room.dto'
import type { IAdminUserDto } from '../users/dto/user.dto'

export interface IGetAllRoomsWithMeta {
	data: IRoomDto[]
	meta: IPaginationConfig
}

export interface IGetAllUsersWithMeta {
	data: Partial<IAdminUserDto>[]
	meta: IPaginationConfig
}

export type TypeUpdateRoomResult<T extends '*' | 'id'> = T extends '*'
	? IRooms
	: TypeAppID
