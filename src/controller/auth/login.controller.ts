import type { IncomingMessage, ServerResponse } from 'http'
import type { LoginDto } from '../../dto/auth/login.dto'
import { authService } from '../../service/auth/auth.service'
import { responseBadRequest } from '../../utils/app/errorResponse.utils'
import { writeHeadData } from '../../utils/app/writeHeadData.utils'
import { ApiError } from '../../utils/log/exists-error.log'

export const authLoginController = async (
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>,
	body: LoginDto
): Promise<void> => {
	try {
		const headData = writeHeadData(200)
		const user = await authService.login(body)

		if (user.status === 404) {
			res.writeHead(user.status, headData.contentData)
		} else if (user.status === 400) {
			res.writeHead(user.status, headData.contentData)
		} else {
			res.writeHead(headData.status, headData.contentData)
		}

		const jsonData = JSON.stringify(user)
		res.end(jsonData)
	} catch (error) {
		if (error instanceof Error) {
			const errorRes = ApiError.BadRequest(error.message)

			await responseBadRequest(errorRes.message, res)
		} else {
			const errorRes = ApiError.BadRequest('Bad-request from login controller')

			await responseBadRequest(errorRes.message, res)
		}
	}
}
