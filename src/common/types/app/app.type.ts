export interface IAppMessage {
	message: string
}

export interface IAppService extends IAppMessage {
	status: number
}

export interface IAppQueryParams {
	queryParams: Record<string, string> | undefined
	path: string
	searchParams: string | undefined
	query: string | null
}

export interface IAppEnCrypto {
	encrypted: string
	iv: string
	tag: string
}

export interface IAppCountShared {
	count: string
}

export interface IPaginationConfig {
	total: number
	limit: number
	offset: number
}
