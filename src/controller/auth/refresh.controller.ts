import type { IncomingMessage, ServerResponse } from 'http'
import { responseBadRequest } from '../../utils/app/errorResponse.utils'
import { writeHeadData } from '../../utils/app/writeHeadData.utils'
import { ApiError } from '../../utils/log/exists-error.log'

export const authRefreshTokenController = async (
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>
): Promise<void> => {
	try {
		const headData = writeHeadData(200)
		res.writeHead(headData.status, headData.contentData)

		const data = { message: 'refresh controller' }
		const jsonData = JSON.stringify(data)

		res.end(jsonData)
	} catch (error) {
		const errorRes = ApiError.BadRequest(
			'Bad-request from refresh-token controller'
		)

		await responseBadRequest(errorRes.message, res)
	}
}
