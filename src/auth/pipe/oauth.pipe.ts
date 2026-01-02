import type {
	IOAuthCallback,
	IOAuthTelegramCallbackDto,
} from '../dto/oauth.dto'
import type {
	IGithubTokenResponse,
	IGithubUserEmailResponse,
	IGithubUserResponse,
	IOAuthError,
	IResponseGoogleApi,
	IResponseYandexInfo,
	IResponseYandexTokenApi,
	TypeGoogleRefreshTokenResponse,
} from '../types/api.types'

export const isCodeOAuthCallbackDto = (obj: unknown): obj is IOAuthCallback => {
	const isCommonValidObj = typeof obj === 'object' && obj !== null

	if (!isCommonValidObj) return false

	const isValidCode =
		isCommonValidObj && 'code' in obj && typeof obj.code === 'string'

	const isValidState =
		isCommonValidObj && 'state' in obj && typeof obj.state === 'string'

	return isValidCode && isValidState
}

export const isResponseErrorDataApi = (obj: unknown): obj is IOAuthError => {
	const isCommonValueObj = typeof obj === 'object' && obj !== null

	if (!isCommonValueObj) return false

	const isValidErrorObj =
		isCommonValueObj && 'error' in obj && typeof obj.error === 'string'

	const isValidErrorDescription =
		isCommonValueObj &&
		'error_description' in obj &&
		typeof obj.error_description === 'string'

	return isValidErrorObj || isValidErrorDescription
}

// Google
export const isResponseGoogleDataApi = (
	obj: unknown
): obj is IResponseGoogleApi => {
	const isCommonValidObj = typeof obj === 'object' && obj !== null

	if (!isCommonValidObj) return false

	const isValidValue =
		isCommonValidObj &&
		'access_token' in obj &&
		typeof obj.access_token === 'string' &&
		'expires_in' in obj &&
		typeof obj.expires_in === 'number' &&
		'scope' in obj &&
		typeof obj.scope === 'string' &&
		'token_type' in obj &&
		typeof obj.token_type === 'string' &&
		'id_token' in obj &&
		typeof obj.id_token === 'string'

	const isValidWithRefreshToken =
		isCommonValidObj &&
		'refresh_token' in obj &&
		typeof obj.refresh_token === 'string'

	return isValidValue || isValidWithRefreshToken
}

export const isResponseGoogleRefreshDataApi = (
	obj: unknown
): obj is TypeGoogleRefreshTokenResponse => {
	const isCommonValidObj = typeof obj === 'object' && obj !== null

	if (!isCommonValidObj) return false

	const isValidValue =
		isCommonValidObj &&
		'access_token' in obj &&
		typeof obj.access_token === 'string' &&
		'expires_in' in obj &&
		typeof obj.expires_in === 'number' &&
		'scope' in obj &&
		typeof obj.scope === 'string' &&
		'token_type' in obj &&
		typeof obj.token_type === 'string'

	return isValidValue
}

// Github

export const isResponseGithubTokenApi = (
	obj: unknown
): obj is IGithubTokenResponse => {
	const isCommonValidObj = typeof obj === 'object' && obj !== null

	if (!isCommonValidObj) return false

	const isValidValue =
		'access_token' in obj &&
		typeof obj.access_token === 'string' &&
		'token_type' in obj &&
		typeof obj.token_type === 'string' &&
		'scope' in obj &&
		typeof obj.scope === 'string'

	return isValidValue
}

export const isResponseGithubUserApi = (
	obj: unknown
): obj is IGithubUserResponse => {
	const isCommonValidObj = typeof obj === 'object' && obj !== null

	if (!isCommonValidObj) return false

	const data = obj as Record<string, unknown>

	const isValidValue =
		typeof data.login === 'string' &&
		typeof data.id === 'number' &&
		typeof data.node_id === 'string' &&
		typeof data.avatar_url === 'string' &&
		typeof data.gravatar_id === 'string' &&
		typeof data.url === 'string' &&
		typeof data.html_url === 'string' &&
		typeof data.followers_url === 'string' &&
		typeof data.following_url === 'string' &&
		typeof data.gists_url === 'string' &&
		typeof data.starred_url === 'string' &&
		typeof data.subscriptions_url === 'string' &&
		typeof data.organizations_url === 'string' &&
		typeof data.repos_url === 'string' &&
		typeof data.events_url === 'string' &&
		typeof data.received_events_url === 'string' &&
		typeof data.type === 'string' &&
		typeof data.site_admin === 'boolean' &&
		(typeof data.name === 'string' || data.name === null) &&
		(typeof data.company === 'string' || data.company === null) &&
		typeof data.blog === 'string' &&
		(typeof data.location === 'string' || data.location === null) &&
		(typeof data.email === 'string' || data.email === null) &&
		(typeof data.hireable === 'string' || data.hireable === null) &&
		(typeof data.bio === 'string' || data.bio === null) &&
		(typeof data.twitter_username === 'string' ||
			data.twitter_username === null) &&
		(typeof data.notification_email === 'string' ||
			data.notification_email === null) &&
		typeof data.public_repos === 'number' &&
		typeof data.public_gists === 'number' &&
		typeof data.followers === 'number' &&
		typeof data.following === 'number' &&
		typeof data.created_at === 'string' &&
		typeof data.updated_at === 'string'

	return isValidValue
}

export const isResponseGithubEmailsApi = (
	obj: unknown
): obj is IGithubUserEmailResponse[] => {
	const isCommonValidObj = Array.isArray(obj) && obj !== null

	if (!isCommonValidObj) return false

	const data = obj[0] as object

	const commonData =
		'email' in data &&
		typeof data.email === 'string' &&
		'primary' in data &&
		typeof data.primary === 'boolean' &&
		'verified' in data &&
		typeof data.verified === 'boolean'

	const isValidStringValue =
		commonData && 'visibility' in data && typeof data.visibility === 'string'
	const isValidNullValue =
		commonData && 'visibility' in data && data.visibility === null

	return isValidStringValue || isValidNullValue
}

// Yandex

export const isResponseYandexTokenApi = (
	obj: unknown
): obj is IResponseYandexTokenApi => {
	const isCommonValidObj = typeof obj === 'object' && obj !== null

	if (!isCommonValidObj) return false

	const isValidValue =
		'access_token' in obj &&
		typeof obj.access_token === 'string' &&
		'expires_in' in obj &&
		typeof obj.expires_in === 'number' &&
		'token_type' in obj &&
		typeof obj.token_type === 'string' &&
		'refresh_token' in obj &&
		typeof obj.refresh_token === 'string'

	return isValidValue
}

export const isResponseYandexInfoApi = (
	obj: unknown
): obj is IResponseYandexInfo => {
	const isCommonValidObj = typeof obj === 'object' && obj !== null

	if (!isCommonValidObj) return false

	const data = obj as Record<string, string | boolean>

	const isValidValue =
		typeof data.id === 'string' &&
		typeof data.login === 'string' &&
		typeof data.client_id &&
		typeof data.display_name === 'string' &&
		typeof data.real_name === 'string' &&
		typeof data.first_name === 'string' &&
		typeof data.last_name === 'string' &&
		typeof data.sex === 'string' &&
		typeof data.default_email === 'string' &&
		Array.isArray(data.emails) &&
		typeof data.emails[0] === 'string' &&
		typeof data.default_avatar_id === 'string' &&
		typeof data.is_avatar_empty === 'boolean' &&
		typeof data.psuid === 'string'

	return isValidValue
}

// Telegram

export const isResponseTelegramApi = (
	obj: unknown
): obj is IOAuthTelegramCallbackDto => {
	const isCommonValidObj = typeof obj === 'object' && obj !== null

	if (!isCommonValidObj) return false

	const isValidUser =
		'user' in obj &&
		typeof obj.user === 'object' &&
		obj.user !== null &&
		'id' in obj.user &&
		typeof obj.user.id === 'number' &&
		'auth_date' in obj.user &&
		typeof obj.user.auth_date === 'number' &&
		'first_name' in obj.user &&
		typeof obj.user.first_name === 'string' &&
		'hash' in obj.user &&
		typeof obj.user.hash === 'string' &&
		'photo_url' in obj.user &&
		typeof obj.user.photo_url === 'string' &&
		'username' in obj.user &&
		typeof obj.user.username === 'string'

	const stateValid = 'state' in obj

	const isValidStateValue =
		(stateValid && typeof obj.state === 'string') ||
		(stateValid && obj.state === null)

	const isValidEmail = 'email' in obj && typeof obj.email === 'string'

	return isValidUser && isValidEmail && isValidStateValue
}
