import type { IErrorResponseApp } from '../../common/types/db/app.interface'

export const getOAuthToken = async (
	url: string,
	method: 'POST' | 'GET',
	headers: Record<string, string>,
	isBodyJson?: boolean,
	data?: Record<string, string> | URLSearchParams
): Promise<unknown | null | IErrorResponseApp> => {
	const bodyData =
		data && isBodyJson
			? JSON.stringify(data)
			: new URLSearchParams(data) ?? undefined

	const response = await fetch(url, {
		method,
		headers,
		body: bodyData,
	})

	const result = await response.json()

	return result
}
