export interface IAppMessage {
	message: string
}

export interface IAppService extends IAppMessage {
	status: number
}

export interface IAppQueryParams {
	query: Record<string, string> | undefined
	path: string
	searchParams: string | undefined
}
