import { globalPrefixUrl } from './global.constant'

// Auth base
export const AUTH_LOGIN_API_URL = `${globalPrefixUrl}/auth/login`
export const AUTH_REGISTRATION_API_URL = `${globalPrefixUrl}/auth/registration`
export const AUTH_LOGOUT_API_URL = `${globalPrefixUrl}/auth/logout`
export const AUTH_REFRESH_TOKEN_API_URL = `${globalPrefixUrl}/auth/refresh`
// Verify
export const AUTH_ACTIVATION_EMAIL_API_URL = `${globalPrefixUrl}/auth/activate`
export const AUTH_ACTIVATION_EMAIL_REPAID_API_URL = `${globalPrefixUrl}/auth/repaid/activate`
// Forget
export const AUTH_ACTIVATION_EMAIL_FORGET_API_URL = `${globalPrefixUrl}/auth/forget/activate`
export const AUTH_FORGET_NEW_PASSWORD_API_URL = `${globalPrefixUrl}/auth/forget/new`
// 2FA
export const AUTH_ENABLE_TWO_FACTORY_CHALLENGE = `${globalPrefixUrl}/auth/two-fa/enable`
export const AUTH_VERIFY_TWO_FACTORY_CODE = `${globalPrefixUrl}/auth/two-fa/verify/code`

// OAuth2.0 Google
export const AUTH_GET_GOOGLE_URL = `${globalPrefixUrl}/auth/google/url`
export const AUTH_CODE_GOOGLE_CALLBACK_URL = `${globalPrefixUrl}/auth/google/callback`
export const AUTH_GOOGLE_REFRESH_TOKEN = `${globalPrefixUrl}/auth/google/refresh`
export const googleUrl = 'https://accounts.google.com'
export const googlePublicJwksUrl = 'https://www.googleapis.com/oauth2/v3/certs'
export const googleTokenUrl = 'https://oauth2.googleapis.com/token'

export const rootAuthRouter = [
	AUTH_LOGIN_API_URL,
	AUTH_REGISTRATION_API_URL,
	AUTH_LOGOUT_API_URL,
	AUTH_REFRESH_TOKEN_API_URL,
	AUTH_ACTIVATION_EMAIL_API_URL,
	AUTH_ACTIVATION_EMAIL_REPAID_API_URL,
	AUTH_ACTIVATION_EMAIL_FORGET_API_URL,
	AUTH_FORGET_NEW_PASSWORD_API_URL,
	AUTH_ENABLE_TWO_FACTORY_CHALLENGE,
	AUTH_VERIFY_TWO_FACTORY_CODE,
	AUTH_GET_GOOGLE_URL,
	AUTH_CODE_GOOGLE_CALLBACK_URL,
	AUTH_GOOGLE_REFRESH_TOKEN,
]
