import type { IncomingMessage, ServerResponse } from 'http'
import { responseBadRequest } from '../../utils/app/errorResponse.utils'
import { ApiError } from '../../utils/log/exists-error.log'

export const authRegistrationController = async (
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>
): Promise<void> => {
	try {
		res.writeHead(201, { 'Content-Type': 'application/json' })

		const data = { message: 'reg controller' }
		const jsonData = JSON.stringify(data)

		res.end(jsonData)
	} catch (error) {
		const errorRes = ApiError.BadRequest(
			'Bad-request from registration controller :('
		)

		await responseBadRequest(errorRes.message, res)
	}
}
