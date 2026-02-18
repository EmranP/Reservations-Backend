import type { TypeAppID } from '../db/app.interface'

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
	limit: number
	offset: number | string | null
	total?: number
}

export interface IAppSharedDto extends TypeAppID {
	createdAt: Date
	updatedAt: Date
}

export interface IGetAllDataWithMeta<T> {
	data: T[]
	meta: IPaginationConfig
}
