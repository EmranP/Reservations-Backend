import type { IncomingMessage, ServerResponse } from 'http'
import { isAuthLoginDto } from '../../../auth/dto/login.dto'
import { isAuthRegistrationDto } from '../../../auth/dto/registration.dto'
import { authController, authEmailController } from '../../../auth/index.auth'
import {
	validateEmailReg,
	validatePassword,
	validatePhoneReg,
} from '../../../auth/pipe/auth.pipe'
import {
	AUTH_ACTIVATION_EMAIL_API_URL,
	AUTH_ACTIVATION_EMAIL_REPAID_API_URL,
	AUTH_LOGIN_API_URL,
	AUTH_LOGOUT_API_URL,
	AUTH_REFRESH_TOKEN_API_URL,
	AUTH_REGISTRATION_API_URL,
} from '../../../common/constants/api.constant'
import type { IAppQueryParams } from '../../../common/types/app/app.type'
import { responseBadRequest } from '../../../common/utils/app/errorResponse.utils'
import { ApiError } from '../../../common/utils/log/exists-error.log'

export const authRouter = async (
	isAuth: ApiError | undefined,
	path: string,
	pathOption: IAppQueryParams,
	isAuthActivatePath: string,
	isAuthActivateRepaid: string,
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
		if (body.email && !validateEmailReg(body.email)) {
			await responseBadRequest('Email is not valid', res)

			return
		} else if (body.phone && !validatePhoneReg(body.phone)) {
			await responseBadRequest('Phone is not valid', res)

			return
		}

		await authController.login(req, res, body)
	} else if (path === AUTH_REGISTRATION_API_URL && req.method === 'POST') {
		if (!isAuthRegistrationDto(body)) {
			await responseBadRequest('Invalid data registration!', res)

			return
		}

		if (body.email && !validateEmailReg(body.email)) {
			await responseBadRequest('Email is not valid', res)

			return
		} else if (body.phone && !validatePhoneReg(body.phone)) {
			await responseBadRequest('Phone is not valid', res)

			return
		} else if (body.password) {
			const isValidPass = validatePassword(body.password)

			if (!isValidPass.valid) {
				await responseBadRequest(
					isValidPass.message ?? 'Password is not valid',
					res
				)

				return
			}
		}

		// ! Add validate file for avatar

		await authController.registration(req, res, body)
	} else if (path === AUTH_REFRESH_TOKEN_API_URL && req.method === 'POST') {
		// Refresh
		await authController.refresh(req, res, cookie)
	} else if (path === AUTH_LOGOUT_API_URL && req.method === 'POST') {
		// Logout
		await authController.logout(req, res, cookie)
	} else if (
		isAuthActivatePath === AUTH_ACTIVATION_EMAIL_API_URL &&
		path === `${AUTH_ACTIVATION_EMAIL_API_URL}/${pathOption.query}` &&
		req.method === 'GET'
	) {
		// Verify
		await authController.verifyAccount(req, res, pathOption.query)
	} else if (
		isAuthActivatePath === AUTH_ACTIVATION_EMAIL_REPAID_API_URL &&
		path === `${AUTH_ACTIVATION_EMAIL_REPAID_API_URL}/${pathOption.query}` &&
		req.method === 'GET'
	) {
		// Repaid Email link

		await authEmailController.getLink(req, res, pathOption.query)
	} else {
		const apiError = ApiError.BadRequest('Bad-request from auth router')

		await responseBadRequest(apiError.message, res)
	}
}
