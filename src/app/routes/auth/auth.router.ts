import type { IncomingMessage, ServerResponse } from 'http'
import { isAuthLoginDto } from '../../../auth/dto/login.dto'
import { isAuthRegistrationDto } from '../../../auth/dto/registration.dto'
import { authController } from '../../../auth/index.auth'
import {
	AUTH_LOGIN_API_URL,
	AUTH_LOGOUT_API_URL,
	AUTH_REFRESH_TOKEN_API_URL,
	AUTH_REGISTRATION_API_URL,
} from '../../../common/constants/api.constant'
import { responseBadRequest } from '../../../common/utils/app/errorResponse.utils'
import { ApiError } from '../../../common/utils/log/exists-error.log'

//! Add validate for email checking @ symbol, phone and other
export const authRouter = async (
	isAuth: ApiError | undefined,
	path: string,
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>,
	body?: unknown,
	cookie?: Record<string, string>
): Promise<void> => {
	if (path === AUTH_LOGIN_API_URL && req.method === 'POST') {
		if (!isAuthLoginDto(body)) {
			await responseBadRequest('Invalid data: email, phone or password', res)

			return
		}

		await authController.login(req, res, body)
	} else if (path === AUTH_REGISTRATION_API_URL && req.method === 'POST') {
		if (!isAuthRegistrationDto(body)) {
			await responseBadRequest('Invalid data registration!', res)

			return
		}

		await authController.registration(req, res, body)
	} else if (path === AUTH_REFRESH_TOKEN_API_URL && req.method === 'POST') {
		await authController.refresh(req, res, cookie)
	} else if (path === AUTH_LOGOUT_API_URL && req.method === 'GET') {
		await authController.logout(req, res, cookie)
	} else {
		const apiError = ApiError.BadRequest('Bad-request from auth router')

		await responseBadRequest(apiError.message, res)
	}
}
