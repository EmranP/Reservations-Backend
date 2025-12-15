import { globalPrefixUrl } from './global.constant'

// Profile Me Get
export const PROFILE_ME_GET = `${globalPrefixUrl}/profile/me`
// Profile Edit
export const PROFILE_EDIT = `${globalPrefixUrl}/profile/edit/me`
// Profile Image
export const PROFILE_UPLOAD_IMAGE = `${globalPrefixUrl}/profile/upload/image`
export const PROFILE_REMOVE_IMAGE = `${globalPrefixUrl}/profile/remove/image`

export const rootProfileRouter = [
	PROFILE_ME_GET,
	PROFILE_EDIT,
	PROFILE_UPLOAD_IMAGE,
	PROFILE_REMOVE_IMAGE,
]
