import type { IncomingMessage, ServerResponse } from 'http'
import { authLoginController } from '../../controller/auth/login.controller'
import { authLogoutController } from '../../controller/auth/logout.controller'
import { authRefreshTokenController } from '../../controller/auth/refresh.controller'
import { authRegistrationController } from '../../controller/auth/registration.controller'
import {
	AUTH_LOGIN_API_URL,
	AUTH_LOGOUT_API_URL,
	AUTH_REFRESH_TOKEN_API_URL,
	AUTH_REGISTRATION_API_URL,
} from '../../shared/constants/api.constant'
import { responseBadRequest } from '../../utils/app/errorResponse.utils'
import { ApiError } from '../../utils/log/exists-error.log'
import type { TypeContextBody } from '../../shared/types/middlewares/body-parser.type'

export const authRouter = async (
	path: string,
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>,
	body?: TypeContextBody
): Promise<void> => {
	if (path === AUTH_LOGIN_API_URL && req.method === 'POST') {
		await authLoginController(req, res, body)
	} else if (path === AUTH_REGISTRATION_API_URL && req.method === 'POST') {
		await authRegistrationController(req, res)
	} else if (path === AUTH_LOGOUT_API_URL && req.method === 'GET') {
		//! Add before controller middleware for check auth and roles user
		await authLogoutController(req, res)
	} else if (path === AUTH_REFRESH_TOKEN_API_URL && req.method === 'POST') {
		//! Add before controller middleware for check auth and roles user
		await authRefreshTokenController(req, res)
	} else {
		const apiError = ApiError.BadRequest('Bad-request from auth router')

		await responseBadRequest(apiError.message, res)
	}
}
