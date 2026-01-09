import type { IErrorResponseApp } from '../../common/types/db/app.interface'

export const postOAuth = async (
	url: string,
	method: 'POST' | 'GET',
	headers?: Record<string, string>,
	isBodyJson?: boolean,
	data?: Record<string, string> | URLSearchParams
): Promise<unknown | null | IErrorResponseApp> => {
	const bodyData =
		data && isBodyJson
			? JSON.stringify(data)
			: data
			? new URLSearchParams(data)
			: undefined

	const response = await fetch(url, {
		method,
		headers,
		body: bodyData,
	})

	const result = await response.json()

	return result
}

export const getOAuth = async (
	url: string,
	method: 'GET',
	headers?: Record<string, string>
): Promise<unknown | null | IErrorResponseApp> => {
	const response = await fetch(url, {
		method,
		headers,
	})

	const result = await response.json()

	return result
}
