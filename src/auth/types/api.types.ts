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

// Github

export interface IGithubTokenResponse {
	access_token: string
	token_type: string
	scope: string
}

export interface IGithubUserResponse {
	login: string
	id: number
	node_id: string
	avatar_url: string
	gravatar_id: string
	url: string
	html_url: string
	followers_url: string
	following_url: string
	gists_url: string
	starred_url: string
	subscriptions_url: string
	organizations_url: string
	repos_url: string
	events_url: string
	received_events_url: string
	type: string
	user_view_type: string
	site_admin: boolean
	name: string
	company: string | null
	blog: string
	location: string | null
	email: string | null
	hireable: string | null
	bio: string | null
	twitter_username: string | null
	notification_email: string | null
	public_repos: number
	public_gists: number
	followers: number
	following: number
	created_at: Date
	updated_at: Date
}

export interface IGithubUserEmailResponse {
	email: string
	primary: boolean
	verified: boolean
	visibility: string
}
