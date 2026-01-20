import type { RoomDto } from '../dto/room.dto'

export const isCreateRoomDto = (obj: unknown): obj is RoomDto => {
	const isCommonValidObj = typeof obj === 'object' && obj !== null

	if (!isCommonValidObj) return false

	const isValid =
		'price' in obj &&
		typeof obj.price === 'number' &&
		'quality' in obj &&
		typeof obj.quality === 'string' &&
		'description' in obj &&
		typeof obj.description === 'string' &&
		'status' in obj &&
		typeof obj.status === 'string'

	return isValid
}

export const isEditRoomDto = (obj: unknown): obj is RoomDto => {
	const isCommonValidObj = typeof obj === 'object' && obj !== null

	if (!isCommonValidObj) return false

	const isValidPrice = 'price' in obj && typeof obj.price === 'number'
	const isValidQuality = 'quality' in obj && typeof obj.quality === 'string'
	const isValidDescription =
		'description' in obj && typeof obj.description === 'string'
	const isValidStatus = 'status' in obj && typeof obj.status === 'string'

	return isValidPrice || isValidQuality || isValidDescription || isValidStatus
}
