import type { IRooms } from '../../app/db/types/rooms.types'
import type { TypeAppID } from '../../common/types/db/app.interface'

export type TypeUpdateRoomResult<T extends '*' | 'id'> = T extends '*'
	? IRooms
	: TypeAppID
