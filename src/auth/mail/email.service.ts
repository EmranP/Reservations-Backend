import { createTransport, type Transporter } from 'nodemailer'
import type { Logger } from 'winston'
import { EMAIL_CONFIG } from '../../common/config/app.config'
import type { UserModel } from '../../user/user.model'
import type { AuthModel } from '../auth.model'
import { AuthService } from '../auth.service'
import type { TokenService } from '../token/token.service'

export class EmailService extends AuthService {
	private transporter: Transporter

	constructor(
		model: AuthModel,
		userModel: UserModel,
		tokenService: TokenService,
		logger: Logger
	) {
		super(model, userModel, tokenService, logger)

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
	): Promise<boolean> {
		try {
			await this.transporter.sendMail({
				from: EMAIL_CONFIG.USER,
				to,
				subject: subject,
				text: '',
				html,
			})

			return true
		} catch (error) {
			if (error instanceof Error) {
				this.logger.error(`Ошибка при отправке письма: ${error.message}`)
			} else {
				this.logger.error(`Ошибка при отправке письма`)
			}

			return false
		}
	}
}
