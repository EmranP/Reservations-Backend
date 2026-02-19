import type { IncomingMessage, ServerResponse } from 'http'
import { isDev } from '../app/app'
import {
	AUTH_ACTIVATION_EMAIL_API_URL,
	AUTH_ACTIVATION_EMAIL_FORGET_API_URL,
	AUTH_ACTIVATION_EMAIL_REPAID_API_URL,
	AUTH_ENABLE_TWO_FACTORY_CHALLENGE,
	AUTH_FORGET_NEW_PASSWORD_API_URL,
	AUTH_GET_GITHUB_URL,
	AUTH_GET_GOOGLE_URL,
	AUTH_GET_YANDEX_URL,
	AUTH_GITHUB_CALLBACK_URL,
	AUTH_GOOGLE_CALLBACK_URL,
	AUTH_GOOGLE_REFRESH_TOKEN,
	AUTH_LOGIN_API_URL,
	AUTH_LOGOUT_API_URL,
	AUTH_REFRESH_TOKEN_API_URL,
	AUTH_REGISTRATION_API_URL,
	AUTH_TELEGRAM,
	AUTH_TELEGRAM_REFRESH,
	AUTH_VERIFY_TWO_FACTORY_CODE,
	AUTH_YANDEX_CALLBACK_URL,
	AUTH_YANDEX_REFRESH_TOKEN,
} from '../common/constants/auth.constant'
import type { IAppQueryParams } from '../common/types/app/app.type'
import { isRequestUserApp } from '../common/utils/app/checkType.utils'
import { responseBadRequest } from '../common/utils/app/errorResponse.utils'
import { ApiError } from '../common/utils/log/exists-error.log'
import { isConfirmNewPassDto } from './dto/forget.dto'
import { isAuthLoginDto } from './dto/login.dto'
import { isRecaptchaDto } from './dto/recaptcha.dto'
import { isAuthRegistrationDto } from './dto/registration.dto'
import { isRepaidVerifyDto } from './dto/verify.dto'
import {
	authController,
	authTwoFactoryController,
	oAuthGithubController,
	oAuthGoogleController,
	oAuthTelegramController,
	oAuthYandexController,
} from './index.auth'
import { verifyRecaptcha } from './middleware/recaptcha.auth'
import {
	isAuthVerifyTwoFactory,
	isEnableTwoFactoryChallengeDto,
} from './pipe/auth-2fa.pipe'
import {
	validateEmailReg,
	validatePassword,
	validatePhoneReg,
	validatePinCode,
} from './pipe/auth-valid.pipe'
import {
	isCodeOAuthCallbackDto,
	isResponseTelegramApi,
} from './pipe/oauth.pipe'

export const authRouter = async (
	isAuth: ApiError | undefined,
	path: string,
	pathOption: IAppQueryParams,
	isAuthActivatePath: string,
	isAuthActivateForget: string,
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>,
	body?: unknown,
	cookie?: Record<string, string>
): Promise<void> => {
	// Login =======================================
	if (path === AUTH_LOGIN_API_URL && req.method === 'POST') {
		if (!isDev) {
			if (!isRecaptchaDto(body)) {
				await responseBadRequest('Invalid data: Recaptcha-token', res)

				return
			}

			const isVerifyRecaptcha = await verifyRecaptcha(body.recaptchaToken)

			if (
				typeof isVerifyRecaptcha === 'object' &&
				'message' in isVerifyRecaptcha
			) {
				await responseBadRequest(isVerifyRecaptcha.message, res)

				return
			}
		}

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

		await authController.login(res, body)
	}
	// Registration =======================================
	else if (path === AUTH_REGISTRATION_API_URL && req.method === 'POST') {
		if (!isDev) {
			if (!isRecaptchaDto(body)) {
				await responseBadRequest('Invalid data: Recaptcha-token', res)

				return
			}

			const isVerifyRecaptcha = await verifyRecaptcha(body.recaptchaToken)

			if (
				typeof isVerifyRecaptcha === 'object' &&
				'message' in isVerifyRecaptcha
			) {
				await responseBadRequest(isVerifyRecaptcha.message, res)

				return
			}
		}

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

		await authController.registration(res, body)
	}
	// Refresh =======================================
	else if (path === AUTH_REFRESH_TOKEN_API_URL && req.method === 'POST') {
		await authController.refresh(res, cookie)
	}

	// Logout =======================================
	else if (path === AUTH_LOGOUT_API_URL && req.method === 'POST') {
		await authController.logout(res, cookie)
	}
	// Verify =======================================
	else if (
		isAuthActivatePath === AUTH_ACTIVATION_EMAIL_API_URL &&
		path === `${AUTH_ACTIVATION_EMAIL_API_URL}/${pathOption.query}` &&
		req.method === 'GET'
	) {
		await authController.verifyAccount(res, pathOption.query)
	}
	// REPAID Email link =======================================
	else if (
		path === AUTH_ACTIVATION_EMAIL_REPAID_API_URL &&
		req.method === 'POST'
	) {
		if (!isRepaidVerifyDto(body)) {
			await responseBadRequest('Invalid data repaid send email!', res)

			return
		}

		await authController.getLink(res, body)
	}
	// Forget: Get link =======================================
	else if (
		path === AUTH_ACTIVATION_EMAIL_FORGET_API_URL &&
		req.method === 'POST'
	) {
		if (!isRepaidVerifyDto(body)) {
			await responseBadRequest('Invalid data send email reset password!', res)

			return
		}

		await authController.getForgetLink(res, body)
	}
	// Forget: Verify  =======================================
	else if (
		isAuthActivateForget === AUTH_ACTIVATION_EMAIL_FORGET_API_URL &&
		path === `${AUTH_ACTIVATION_EMAIL_FORGET_API_URL}/${pathOption.query}` &&
		req.method === 'GET'
	) {
		await authController.verifyForgetPassword(res, pathOption.query)
	}
	// Forget: New password =======================================
	else if (path === AUTH_FORGET_NEW_PASSWORD_API_URL && req.method === 'POST') {
		if (!isConfirmNewPassDto(body)) {
			await responseBadRequest('Invalid data send new password!', res)

			return
		}

		if (body.email && !validateEmailReg(body.email)) {
			await responseBadRequest('Email is not valid', res)

			return
		}

		const isValidPass = validatePassword(String(body.newPassword))

		if (!isValidPass.valid) {
			await responseBadRequest(
				isValidPass.message ?? 'Password is not valid',
				res
			)

			return
		}

		await authController.newPassword(res, body)
	}
	// 2FA
	else if (
		path === AUTH_ENABLE_TWO_FACTORY_CHALLENGE &&
		req.method === 'POST'
	) {
		if (isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isEnableTwoFactoryChallengeDto(body)) {
			await responseBadRequest(
				'Invalid data from body enable-2fa, must be isEnableTwoAuthCode',
				res,
				400
			)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}

		await authTwoFactoryController.editEnableTwoFactory(req, res, body)
	} else if (path === AUTH_VERIFY_TWO_FACTORY_CODE && req.method === 'POST') {
		if (!isAuthVerifyTwoFactory(body)) {
			await responseBadRequest(
				'Invalid data from body 2FA verify-code.',
				res,
				400
			)

			return
		}

		if (body.email && !validateEmailReg(body.email)) {
			await responseBadRequest('Email is not valid', res)

			return
		} else if (body.phone && !validatePhoneReg(body.phone)) {
			await responseBadRequest('Phone is not valid', res)

			return
		}

		if (body.code) {
			const isValidCode = validatePinCode(body.code)

			if (isValidCode.message && typeof isValidCode.message === 'string') {
				await responseBadRequest(isValidCode.message, res, 400)

				return
			}
		}

		await authTwoFactoryController.verifyCode(res, body)
	}
	// Google OAuth 2.0
	else if (
		(path === AUTH_GET_GOOGLE_URL && req.method === 'GET') ||
		(path === `${AUTH_GET_GOOGLE_URL}${pathOption.searchParams}` &&
			req.method === 'GET')
	) {
		await oAuthGoogleController.googleUrl(res, pathOption)
	} else if (path === AUTH_GOOGLE_CALLBACK_URL && req.method === 'POST') {
		if (!isCodeOAuthCallbackDto(body)) {
			await responseBadRequest(
				'Invalid data from body oauth-google callback.',
				res,
				400
			)

			return
		}

		if (body.code?.length <= 0) {
			await responseBadRequest(
				'In the "code" symbol is must be having.',
				res,
				400
			)

			return
		}

		if (body.state.length <= 0) {
			await responseBadRequest(
				'In the "state" symbol is must be having.',
				res,
				400
			)

			return
		}

		await oAuthGoogleController.googleCallback(res, body)
	}
	// OAuth Google Refresh Token
	else if (path === AUTH_GOOGLE_REFRESH_TOKEN && req.method === 'GET') {
		await oAuthGoogleController.refreshToken(res, cookie)
	}
	// Github OAuth 2.0
	else if (
		(path === AUTH_GET_GITHUB_URL && req.method === 'GET') ||
		(path === `${AUTH_GET_GITHUB_URL}${pathOption.searchParams}` &&
			req.method === 'GET')
	) {
		await oAuthGithubController.githubUrl(res, pathOption)
	} else if (path === AUTH_GITHUB_CALLBACK_URL && req.method === 'POST') {
		if (!isCodeOAuthCallbackDto(body)) {
			await responseBadRequest(
				'Invalid data from body oauth-github callback.',
				res,
				400
			)

			return
		}

		if (body.code?.length <= 0) {
			await responseBadRequest(
				'In the "code" symbol is must be having.',
				res,
				400
			)

			return
		}

		if (body.state.length <= 0) {
			await responseBadRequest(
				'In the "state" symbol is must be having.',
				res,
				400
			)

			return
		}

		await oAuthGithubController.githubCallback(res, body)
	}
	// Yandex OAuth 2.0
	else if (
		(path === AUTH_GET_YANDEX_URL && req.method === 'GET') ||
		(path === `${AUTH_GET_YANDEX_URL}${pathOption.searchParams}` &&
			req.method === 'GET')
	) {
		await oAuthYandexController.yandexUrl(res, pathOption)
	} else if (path === AUTH_YANDEX_CALLBACK_URL && req.method === 'POST') {
		if (!isCodeOAuthCallbackDto(body)) {
			await responseBadRequest(
				'Invalid data from body oauth-github callback.',
				res,
				400
			)

			return
		}

		if (body.code?.length <= 0) {
			await responseBadRequest(
				'In the "code" symbol is must be having.',
				res,
				400
			)

			return
		}

		if (body.state.length <= 0) {
			await responseBadRequest(
				'In the "state" symbol is must be having.',
				res,
				400
			)

			return
		}

		await oAuthYandexController.yandexCallback(res, body)
	} else if (path === AUTH_YANDEX_REFRESH_TOKEN && req.method === 'GET') {
		await oAuthYandexController.refreshToken(res, cookie)
	} else if (path === AUTH_TELEGRAM && req.method === 'POST') {
		if (!isResponseTelegramApi(body)) {
			await responseBadRequest(
				'Invalid data from body oauth-telegram callback.',
				res,
				400
			)

			return
		}

		await oAuthTelegramController.tgCallback(res, body)
	} else if (path === AUTH_TELEGRAM_REFRESH && req.method === 'POST') {
		await oAuthTelegramController.tgRefresh(res, cookie)
	} else {
		await responseBadRequest('Bad-request from auth router', res)
	}
}
