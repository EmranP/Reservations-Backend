export const globalPrefixUrl = 'api'

// Auth
export const AUTH_LOGIN_API_URL = `${globalPrefixUrl}/auth/login`
export const AUTH_REGISTRATION_API_URL = `${globalPrefixUrl}/auth/registration`
export const AUTH_LOGOUT_API_URL = `${globalPrefixUrl}/auth/logout`
export const AUTH_REFRESH_TOKEN_API_URL = `${globalPrefixUrl}/auth/refresh`

export const rootAuthRouter = [
	AUTH_LOGIN_API_URL,
	AUTH_REGISTRATION_API_URL,
	AUTH_LOGOUT_API_URL,
	AUTH_REFRESH_TOKEN_API_URL,
]
