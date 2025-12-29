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

// OAuth 2.0 Google
export const AUTH_GET_GOOGLE_URL = `${globalPrefixUrl}/auth/google/url`
export const AUTH_GOOGLE_CALLBACK_URL = `${globalPrefixUrl}/auth/google/callback`
export const AUTH_GOOGLE_REFRESH_TOKEN = `${globalPrefixUrl}/auth/google/refresh`
export const googleUrl = 'https://accounts.google.com'
export const googlePublicJwksUrl = 'https://www.googleapis.com/oauth2/v3/certs'
export const googleTokenUrl = 'https://oauth2.googleapis.com/token'

// OAuth 2.0 Github
export const AUTH_GET_GITHUB_URL = `${globalPrefixUrl}/auth/github/url`
export const AUTH_GITHUB_CALLBACK_URL = `${globalPrefixUrl}/auth/github/callback`
export const githubUrl = 'https://github.com'
export const githubApiUrl = 'https://api.github.com'
export const githubPublicJwksUrl =
	'https://token.actions.githubusercontent.com/.well-known/jwks'
export const githubOAuthLogin = 'https://github.com/login/oauth/authorize'
export const githubOAuthToken = 'https://github.com/login/oauth/access_token'

// OAuth 2.0 Yandex
export const AUTH_GET_YANDEX_URL = `${globalPrefixUrl}/auth/yandex/url`
export const AUTH_YANDEX_CALLBACK_URL = `${globalPrefixUrl}/auth/yandex/callback`
export const AUTH_YANDEX_REFRESH_TOKEN = `${globalPrefixUrl}/auth/yandex/refresh`
export const yandexUrl = 'https://ya.ru/'
export const yandexOAuthLogin = 'https://oauth.yandex.ru/authorize'
export const yandexOAuthToken = 'https://oauth.yandex.ru'
export const yandexInfoApi = 'https://login.yandex.ru/info'
export const yandexUserAvatarUrl = 'https://avatars.yandex.net/get-yapic'

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
	AUTH_GOOGLE_CALLBACK_URL,
	AUTH_GOOGLE_REFRESH_TOKEN,
	AUTH_GET_GITHUB_URL,
	AUTH_GITHUB_CALLBACK_URL,
	AUTH_GET_YANDEX_URL,
	AUTH_YANDEX_CALLBACK_URL,
	AUTH_YANDEX_REFRESH_TOKEN,
]
