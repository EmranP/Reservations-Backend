import type { IOAuthGoogleCallback } from '../dto/oauth.dto'
import type { IResponseGoogleApi } from '../types/api.types'

export const isCodeOAuthGoogleCallbackDto = (
	obj: unknown
): obj is IOAuthGoogleCallback => {
	const isCommonValidObj = typeof obj === 'object' && obj !== null

	const isValidCode =
		isCommonValidObj && 'code' in obj && typeof obj.code === 'string'

	return isValidCode
}

export const isResponseGoogleDataApi = (
	obj: unknown
): obj is IResponseGoogleApi => {
	const isCommonValidObj = typeof obj === 'object' && obj !== null

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
