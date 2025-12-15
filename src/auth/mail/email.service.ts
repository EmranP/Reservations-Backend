import { createTransport, type Transporter } from 'nodemailer'
import type { Logger } from 'winston'
import { APP_CONFIG, EMAIL_CONFIG } from '../../common/config/app.config'
import {
	activationLinkHandler,
	resetPassLinkHandler,
} from '../../common/constants/link.constant'
import { setMinuteUtil } from '../../common/utils/app/date.util'
import { generateTwoFactoryCode } from '../../common/utils/app/generate.utils'
import {
	renderSendActivationLink,
	renderSendActivationTwoFactoryAuth,
} from '../../common/utils/format/render.util'
import { ApiError } from '../../common/utils/log/exists-error.log'
import type { AuthTwoFactoryChallengeModel } from '../2fa/auth-2fa.model'
import { AuthBaseConfig } from '../abstract/auth-config.base'
import type { AuthModel } from '../auth.model'
import type { RepaidVerifyDto } from '../dto/verify.dto'
import type { IResponseEmail } from '../types/mail.types'
import type { TypeAuthServiceMessageWithApiError } from '../types/types.auth'

export class EmailService extends AuthBaseConfig {
	private transporter: Transporter

	constructor(
		protected logger: Logger,
		protected authModel: AuthModel,
		protected authTwoFactoryModel: AuthTwoFactoryChallengeModel
	) {
		super()
		this.transporter = createTransport({
			host: EMAIL_CONFIG.HOST,
			port: EMAIL_CONFIG.PORT || 587,
			tls: {
				rejectUnauthorized: true,
			},
			secure: false,
			auth: {
				user: EMAIL_CONFIG.USER,
				pass: EMAIL_CONFIG.PASSWORD,
			},
		})
	}

	async send(
		to: string | undefined,
		subject: string,
		html: string
	): Promise<IResponseEmail | string | undefined> {
		try {
			const mailResult = await this.transporter.sendMail({
				from: EMAIL_CONFIG.USER,
				to,
				subject: subject,
				text: '',
				html,
			})

			return mailResult
		} catch (error) {
			let errorMessage: undefined | string
			if (error instanceof Error) {
				errorMessage = `Ошибка при отправке письма: ${error.message}`
				this.logger.error(errorMessage)
			} else {
				errorMessage = `Ошибка при отправке письма`
				this.logger.error(errorMessage)
			}

			return errorMessage
		}
	}

	// !Verify
	async repaidVerifyAccountSendEmail(
		dto: RepaidVerifyDto
	): TypeAuthServiceMessageWithApiError {
		if (!APP_CONFIG.API_URL)
			return {
				message: 'App config is not set api-url',
				status: 500,
			}

		const now = new Date()
		const errorEmailMessage = `A user with email ${dto.email} already exists.`
		const repaidExpireMessage = `Please confirm your account verify the link, you have 2 minutes to do this.`

		const isTimeCheck =
			this.expiresVerify !== null &&
			now.getTime() >= this.expiresVerify.getTime()

		if (
			!isTimeCheck &&
			!this.isFirstSendEmailVerifyAccount &&
			this.expiresVerify !== null
		) {
			return ApiError.BadRequest('Expire time verify is not completed')
		}

		if (
			isTimeCheck &&
			!this.isFirstSendEmailVerifyAccount &&
			this.expiresVerify !== null
		) {
			this.expiresVerify = null

			this.isFirstSendEmailVerifyAccount = true

			return ApiError.BadRequest('Expire verify time that all')
		}

		const user = await this.authModel.getUserByEmail(dto.email)

		if (!user) return ApiError.NotFound('User is not founded!')

		if (user.is_verify)
			return ApiError.BadRequest('User have been success verify')

		const link = activationLinkHandler(APP_CONFIG.API_URL, user.activation_link)
		const renderHtml = renderSendActivationLink(link, 'активировать аккаунт')
		const resultEmail = await this.send(dto.email, 'Verify account', renderHtml)

		if (typeof resultEmail === 'undefined' || typeof resultEmail === 'string')
			return ApiError.BadRequest('Error sending email')

		if (this.expiresVerify === null) {
			this.expiresVerify = setMinuteUtil(this.maxAgeVerify)
		}

		this.isFirstSendEmailVerifyAccount = false

		return {
			message: !isTimeCheck ? repaidExpireMessage : errorEmailMessage,
			status: !isTimeCheck ? 409 : 400,
		}
	}

	// !Reset-password
	async forgetPasswordSendLink(
		dto: RepaidVerifyDto,
		isFirstSendEmailForgetPassword: boolean
	): TypeAuthServiceMessageWithApiError {
		if (!APP_CONFIG.API_URL)
			return {
				message: 'App config is not set api-url',
				status: 500,
			}

		const now = new Date()
		const resetPassExpireMessage = `Please confirm your reset-password verify the link, you have 2 minutes to do this.`

		const user = await this.authModel.getUserByEmail(dto.email)

		if (!user || !user.id) return ApiError.NotFound('User is not founded!')

		const expireUserForgetVerify = await this.authModel.getExpireForget(user.id)

		if (!expireUserForgetVerify)
			return {
				message: 'Expire forget verify not founded',
				status: 500,
			}

		const isTimeCheck =
			expireUserForgetVerify.expires_forget_pass !== null &&
			now.getTime() >= expireUserForgetVerify.expires_forget_pass.getTime()

		if (
			!isTimeCheck &&
			!isFirstSendEmailForgetPassword &&
			expireUserForgetVerify.expires_forget_pass !== null
		) {
			return ApiError.BadRequest('The password reset has not expired.')
		}

		if (
			isTimeCheck &&
			!isFirstSendEmailForgetPassword &&
			expireUserForgetVerify.expires_forget_pass !== null
		) {
			expireUserForgetVerify.expires_forget_pass = null

			isFirstSendEmailForgetPassword = true

			return ApiError.BadRequest('Expire reset verify time that all')
		}

		const resetLink = resetPassLinkHandler(
			APP_CONFIG.API_URL,
			user.reset_pass_link
		)
		const renderHtml = renderSendActivationLink(resetLink, 'сброс пароль')
		const resultEmail = await this.send(dto.email, 'Reset-password', renderHtml)

		if (typeof resultEmail === 'undefined' || typeof resultEmail === 'string')
			return ApiError.BadRequest('Error sending email')

		if (expireUserForgetVerify.expires_forget_pass === null) {
			const newExpireForgetVerify = setMinuteUtil(this.maxAgeResetVerify)

			const updateExpireForget = await this.authModel.updateExpireForgetVerify(
				user.id,
				newExpireForgetVerify
			)

			if (!updateExpireForget)
				return {
					message: 'Something was wrong with update expire forget',
					status: 500,
				}
		}

		return {
			message: !isTimeCheck
				? resetPassExpireMessage
				: 'The password reset has expired!',
			status:
				!isTimeCheck && isFirstSendEmailForgetPassword
					? 200
					: !isTimeCheck
					? 409
					: 400,
		}
	}

	// !2FA
	async sendTwoFactoryCode(
		userEmail: string,
		isTimeCheckTwoFactory: null | boolean,
		expiresTwoFactoryChallenge: Date | null,
		saveTwoFactoryCode: number | null,
		isFirstSendEmailTwoFactoryCode: boolean
	): TypeAuthServiceMessageWithApiError {
		if (
			!isTimeCheckTwoFactory &&
			expiresTwoFactoryChallenge !== null &&
			saveTwoFactoryCode !== null
		) {
			return {
				message: this.expireTwoFactoryNotCompleted,
				status: 409,
				code: saveTwoFactoryCode,
			}
		}

		const codeTwoFactory = generateTwoFactoryCode()
		const renderHtml = renderSendActivationTwoFactoryAuth(
			String(codeTwoFactory)
		)
		const resultEmail = await this.send(userEmail, 'Login with 2FA', renderHtml)

		if (typeof resultEmail === 'undefined' || typeof resultEmail === 'string')
			return ApiError.BadRequest('Error sending email')

		return {
			message:
				!isTimeCheckTwoFactory && !isFirstSendEmailTwoFactoryCode
					? this.expireTwoFactoryNotCompleted
					: this.errorExpireTwoFactoryCodeMessage,
			status:
				!isTimeCheckTwoFactory && !isFirstSendEmailTwoFactoryCode ? 409 : 200,
			code: codeTwoFactory,
		}
	}
}
