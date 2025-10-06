import type { IncomingMessage, ServerResponse } from 'http'
import { responseBadRequest } from '../../utils/app/errorResponse.utils'
import { writeHeadData } from '../../utils/app/writeHeadData.utils'
import { ApiError } from '../../utils/log/exists-error.log'

export interface ILoginController {
	email: string
	password: string
}

//! Add validate && validate type write special decorator and put to service places
export const authLoginController = async (
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>,
	body?: ILoginController
): Promise<void> => {
	const headDataSuccess = writeHeadData(200)
	const headDataBad = writeHeadData(400)
	try {
		if (!body) return
		console.log(body)

		const data = { message: 'Login has success' }
		const jsonData = JSON.stringify(data)
		res.writeHead(headDataSuccess.status, headDataSuccess.contentData)
		res.end(jsonData)
	} catch (error) {
		const errorRes = ApiError.BadRequest(`Bad-request from login controller`)

		await responseBadRequest(errorRes.message, res)
	}
}
