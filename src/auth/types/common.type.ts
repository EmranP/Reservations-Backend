export interface ICommonOAuthBodyData {
	client_id: string
	client_secret: string
	redirect_uri: string
}

export interface ITelegramConfigOAuth {
	tgId: number
	tgToken: string
}
