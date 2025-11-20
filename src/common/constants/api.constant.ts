export const globalPrefixUrl = '/api'
export const isPathWithQuery = (
	origin: string,
	route: string,
	params: string | undefined
) => `${origin}${globalPrefixUrl}/${route}${params ?? ''}`

// Auth ============
export const AUTH_LOGIN_API_URL = `${globalPrefixUrl}/auth/login`
export const AUTH_REGISTRATION_API_URL = `${globalPrefixUrl}/auth/registration`
export const AUTH_LOGOUT_API_URL = `${globalPrefixUrl}/auth/logout`
export const AUTH_REFRESH_TOKEN_API_URL = `${globalPrefixUrl}/auth/refresh`
export const AUTH_ACTIVATION_EMAIL_API_URL = `${globalPrefixUrl}/auth/activate`
export const AUTH_ACTIVATION_EMAIL_REPAID_API_URL = `${globalPrefixUrl}/auth/repaid/activate`

export const rootAuthRouter = [
	AUTH_LOGIN_API_URL,
	AUTH_REGISTRATION_API_URL,
	AUTH_LOGOUT_API_URL,
	AUTH_REFRESH_TOKEN_API_URL,
	AUTH_ACTIVATION_EMAIL_API_URL,
]

// User ===========
export const USER_GET_URL = `${globalPrefixUrl}/user`
export const USER_UPDATE_URL = `${globalPrefixUrl}/user/edit`
export const USER_DELETE_URL = `${globalPrefixUrl}/user/remove`

export const rootUserRouter = [USER_GET_URL, USER_UPDATE_URL, USER_DELETE_URL]
