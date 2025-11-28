import { createTransport, type Transporter } from 'nodemailer'
import type { Logger } from 'winston'
import { EMAIL_CONFIG } from '../../common/config/app.config'
import type { IResponseEmail } from '../types/mail.types'

export class EmailService {
	private transporter: Transporter
	private logger: Logger

	constructor(logger: Logger) {
		this.logger = logger
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

	async sendLink(
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
}
