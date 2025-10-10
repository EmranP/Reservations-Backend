import type { IncomingMessage, ServerResponse } from 'http'
import { isAuthLoginDto } from '../../../auth/dto/login.dto'
import { authController } from '../../../auth/index.auth'
import {
	AUTH_LOGIN_API_URL,
	AUTH_LOGOUT_API_URL,
	AUTH_REFRESH_TOKEN_API_URL,
	AUTH_REGISTRATION_API_URL,
} from '../../../common/constants/api.constant'
import { responseBadRequest } from '../../../common/utils/app/errorResponse.utils'
import { ApiError } from '../../../common/utils/log/exists-error.log'

export const authRouter = async (
	path: string,
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>,
	body?: unknown
): Promise<void> => {
	if (path === AUTH_LOGIN_API_URL && req.method === 'POST') {
		if (!isAuthLoginDto(body)) {
			await responseBadRequest('Invalid data: email or password', res)

			return
		}
		await authController.login(req, res, body)
	} else if (path === AUTH_REGISTRATION_API_URL && req.method === 'POST') {
		// Add validate type for registration body
		await authController.registration(req, res, body)
	} else if (path === AUTH_LOGOUT_API_URL && req.method === 'GET') {
		//! Add before controller middleware for check auth and roles user
		await authController.logout(req, res)
	} else if (path === AUTH_REFRESH_TOKEN_API_URL && req.method === 'POST') {
		//! Add before controller middleware for check auth and roles user
		await authController.refresh(req, res)
	} else {
		const apiError = ApiError.BadRequest('Bad-request from auth router')

		await responseBadRequest(apiError.message, res)
	}
}
