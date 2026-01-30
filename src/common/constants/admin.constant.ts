import { globalPrefixUrl } from './global.constant'

// User ===========
export const USERS_GET_ALL_URL = `${globalPrefixUrl}/users`
export const USERS_GET_ONE_URL = `${globalPrefixUrl}/user`
export const USER_UPDATE_URL = `${globalPrefixUrl}/user/edit`
export const USER_DELETE_URL = `${globalPrefixUrl}/user/remove`

// Rooms
export const ROOMS_CREATE_URL = `${globalPrefixUrl}/room/add`
export const ROOMS_GET_ALL_URL = `${globalPrefixUrl}/rooms`
export const ROOMS_GET_ONE_URL = `${globalPrefixUrl}/room`
export const ROOMS_EDIT_URL = `${globalPrefixUrl}/room/edit`
export const ROOMS_DELETE_IMAGE_URL = `${globalPrefixUrl}/room/delete/image`
export const ROOMS_REMOVE_URL = `${globalPrefixUrl}/room/remove`

export const rootRoomRouter = [
	ROOMS_CREATE_URL,
	ROOMS_GET_ALL_URL,
	ROOMS_GET_ONE_URL,
	ROOMS_EDIT_URL,
	ROOMS_REMOVE_URL,
	ROOMS_DELETE_IMAGE_URL,
]
