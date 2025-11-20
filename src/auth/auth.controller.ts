import type { IncomingMessage, ServerResponse } from 'http'

import type { Logger } from 'winston'
import { TOKEN_CONFIG } from '../common/config/token.config'
import { setDateUtil } from '../common/utils/app/date.util'
import { responseBadRequest } from '../common/utils/app/errorResponse.utils'
import { writeHeadData } from '../common/utils/app/writeHeadData.utils'
import { ApiError } from '../common/utils/log/exists-error.log'
import { AuthService } from './auth.service'
import type { LoginDto } from './dto/login.dto'
import type { RegistrationDto } from './dto/registration.dto'
import type { IAuthUserService } from './types/types.auth'

export class AuthController {
	private expireRefresh = TOKEN_CONFIG.REFRESH_EXPIRE
	private maxAge =
		this.expireRefresh === '7d' ? 7 : this.expireRefresh === '30d' ? 30 : 0
	private expiresToken = setDateUtil(this.maxAge)
	private expiresRemove = new Date(0).toUTCString()

	private headData = writeHeadData(400)

	constructor(private authService: AuthService, private logger: Logger) {}

	async login(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		body: LoginDto
	): Promise<void> {
		try {
			let user: Partial<IAuthUserService> | undefined

			if (body.email) {
				user = await this.authService.loginEmail(body)
			} else if (body.phone) {
				user = await this.authService.loginPhone(body)
			}

			if (user && user.status && user.status >= 400) {
				const errorJsonData = JSON.stringify({ message: user.message })

				res.writeHead(user.status ?? 500, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			const userDto = {
				user: { ...user?.user },
				accessToken: user?.accessToken,
			}
			const jsonData = JSON.stringify(userDto)

			res.setHeader(
				'Set-cookie',
				`refreshToken=${
					user?.refreshToken
				}; httpOnly; path=/api; Expires=${this.expiresToken.toUTCString()}; SameSite=Strict`
			)
			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			if (error instanceof Error) {
				const errorRes = ApiError.BadRequest(error.message)

				this.logger.error(errorRes.message)
				await responseBadRequest(errorRes.message, res)
			} else {
				const errorRes = ApiError.BadRequest(
					'Bad-request from login controller'
				)

				await responseBadRequest(errorRes.message, res)
			}
		}
	}

	async registration(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		body: RegistrationDto
	): Promise<void> {
		try {
			const newUser = await this.authService.registration(body)

			if (newUser.message || (newUser.status && newUser.status >= 400)) {
				const errorData = JSON.stringify({ message: newUser.message })

				res.writeHead(newUser.status ?? 500, this.headData.contentData)
				res.end(errorData)

				return
			}

			const jsonData = JSON.stringify(newUser)

			res.writeHead(201, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			const errorRes = ApiError.BadRequest(
				'Bad-request from registration controller :('
			)

			this.logger.error(errorRes.message)

			await responseBadRequest(errorRes.message, res)
		}
	}

	async refresh(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		cookies: Record<string, string> | undefined
	) {
		try {
			if (!cookies || !cookies.refreshToken) {
				const error = JSON.stringify({
					message: 'Bad-request Cookie is not have',
				})

				res.writeHead(400, this.headData.contentData)
				res.end(error)

				return
			}

			const { refreshToken } = cookies

			const newRefresh = await this.authService.refreshToken(refreshToken)

			if (
				newRefresh.message ||
				(newRefresh.status && newRefresh.status >= 400)
			) {
				const errorData = JSON.stringify({ message: newRefresh.message })

				res.writeHead(newRefresh.status ?? 500, this.headData.contentData)
				res.end(errorData)

				return
			}

			const jsonData = JSON.stringify({ accessToken: newRefresh.accessToken })

			res.setHeader(
				'Set-cookie',
				`refreshToken=${
					newRefresh?.refreshToken
				}; httpOnly; path=/api; Expires=${this.expiresToken.toUTCString()}; SameSite=Strict`
			)
			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			const errorRes = ApiError.BadRequest(
				'Bad-request from refresh controller'
			)

			this.logger.error(errorRes.message)

			await responseBadRequest(errorRes.message, res)
		}
	}

	async verifyAccount(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		link: string | null
	) {
		try {
			const verifyUser = await this.authService.verifyAccount(link)

			const jsonData = JSON.stringify({ message: verifyUser.message })

			res.writeHead(verifyUser.status, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			const errorRes = ApiError.BadRequest(
				'Bad-request from verify-account controller'
			)

			this.logger.error(errorRes.message)

			await responseBadRequest(errorRes.message, res)
		}
	}

	async logout(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		cookies: Record<string, string> | undefined
	): Promise<void> {
		try {
			if (
				!cookies ||
				!cookies.refreshToken ||
				cookies.refreshToken === 'refreshToken='
			) {
				const error = JSON.stringify({
					message: 'Bad-request Cookie is not have',
				})

				res.writeHead(400, this.headData.contentData)
				res.end(error)

				return
			}

			const { refreshToken } = cookies

			const resultLogoutService = await this.authService.logout(refreshToken)

			const jsonData = JSON.stringify({ message: resultLogoutService.message })

			res.setHeader(
				'Set-cookie',
				`refreshToken=; httpOnly; path=/api; Expires=${this.expiresRemove}; SameSite=Strict`
			)
			res.writeHead(resultLogoutService.status, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			const errorRes = ApiError.BadRequest('Bad-request from logout controller')

			this.logger.error(errorRes.message)

			await responseBadRequest(errorRes.message, res)
		}
	}
}
