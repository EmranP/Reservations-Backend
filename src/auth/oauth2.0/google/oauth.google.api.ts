import { googleTokenUrl } from '../../../common/constants/auth.constant'
import type { IErrorResponseApp } from '../../../common/types/db/app.interface'

export const getGoogleToken = async (
	data: Record<string, string> | URLSearchParams,
	headers: Record<string, string>,
	isBodyJson: boolean = true
): Promise<unknown | null | IErrorResponseApp> => {
	const bodyData = isBodyJson ? JSON.stringify(data) : new URLSearchParams(data)

	const responseGoogle = await fetch(googleTokenUrl, {
		method: 'POST',
		headers,
		body: bodyData,
	})

	const result = await responseGoogle.json()

	return result
}
