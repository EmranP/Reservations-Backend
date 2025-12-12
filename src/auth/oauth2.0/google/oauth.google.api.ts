import { googleTokenUrl } from '../../../common/constants/auth.constant'
import type { IErrorResponseApp } from '../../../common/types/db/app.interface'
import { isResponseGoogleDataApi } from '../../pipe/oauth.pipe'
import type {
	IBodyDataGetTokenGoogle,
	IResponseGoogleApi,
} from '../../types/api.types'

export const getGoogleToken = async (
	data: Readonly<IBodyDataGetTokenGoogle>
): Promise<IResponseGoogleApi | null | IErrorResponseApp> => {
	const responseGoogle = await fetch(googleTokenUrl, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(data),
	})

	if (!responseGoogle.ok)
		return {
			message: `HTTP error! status: ${responseGoogle.status}`,
			status: responseGoogle.status,
		}

	const result = await responseGoogle.json()

	if (isResponseGoogleDataApi(result)) {
		return result
	}

	return null
}
