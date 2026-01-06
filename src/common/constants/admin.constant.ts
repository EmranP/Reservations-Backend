import { globalPrefixUrl } from './global.constant'

// User ===========
export const USER_GET_URL = `${globalPrefixUrl}/user`
export const USER_UPDATE_URL = `${globalPrefixUrl}/user/edit`
export const USER_DELETE_URL = `${globalPrefixUrl}/user/remove`

export const rootUserRouter = [USER_GET_URL, USER_UPDATE_URL, USER_DELETE_URL]
