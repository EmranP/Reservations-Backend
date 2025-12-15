export interface IResponseGoogleApi {
	access_token: string
	expires_in: number
	scope: string
	token_type: string
	id_token: string
	refresh_token?: string
}

export interface IBodyDataGetTokenGoogle {
	code: string
	client_id: string
	client_secret: string
	redirect_uri: string
	grant_type: string
}

export type TypeGoogleRefreshTokenResponse = Omit<
	IResponseGoogleApi,
	'refresh_token' | 'id_token'
>

export interface IGoogleOAuthError {
	error: string
	error_description?: string
}
