import type { IncomingMessage, ServerResponse } from 'http'

import type { Logger } from 'winston'
import { BaseConfig } from '../common/abstract/auth-config.base'
import { responseInternalServer } from '../common/utils/app/errorResponse.utils'
import { AuthService } from './auth.service'
import type { ForgetDto } from './dto/forget.dto'
import type { LoginDto } from './dto/login.dto'
import type { RegistrationDto } from './dto/registration.dto'
import type { RepaidVerifyDto } from './dto/verify.dto'
import type { EmailService } from './mail/email.service'

export class AuthController extends BaseConfig {
	constructor(
		private authService: AuthService,
		private emailService: EmailService,
		private logger: Logger
	) {
		super()
	}

	async login(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		body: LoginDto
	): Promise<void> {
		try {
			const user = await this.authService.login(body)

			if (user && user.status && user.status >= 400) {
				const errorJsonData = JSON.stringify({ message: user.message })

				res.writeHead(user.status ?? 500, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			if (user?.user?.enableTwoFactoryChallenge && user.status) {
				const enableTwoFactoryJsonData = JSON.stringify({
					message: user.message,
				})

				res.writeHead(user.status, this.headData.contentData)
				res.end(enableTwoFactoryJsonData)

				return
			}

			const userDto = {
				user: { ...user?.user },
				accessToken: user?.accessToken,
			}
			const jsonData = JSON.stringify(userDto)

			if (!user.expireRefreshTokenAt) {
				const errorJsonData = JSON.stringify({
					message: 'Error expire-refresh token is not set',
				})

				res.writeHead(500, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			res.setHeader(
				'Set-cookie',
				`refreshToken=${
					user?.refreshToken
				}; httpOnly; path=/api; Expires=${user.expireRefreshTokenAt.toUTCString()}; SameSite=Strict`
			)
			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from login controller',
				this.logger
			)
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
			await responseInternalServer(
				error,
				res,
				'Internal-server from registration controller :(',
				this.logger
			)
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

			const newRefresh = await this.authService.refresh(refreshToken)

			if (
				('message' in newRefresh && newRefresh.message) ||
				(newRefresh.status && newRefresh.status >= 400)
			) {
				const errorData = JSON.stringify({ message: newRefresh.message })

				res.writeHead(newRefresh.status ?? 500, this.headData.contentData)
				res.end(errorData)

				return
			}

			if (!newRefresh.expireRefreshTokenAt) {
				const errorJsonData = JSON.stringify({
					message: 'Error expire-refresh token is not set',
				})

				res.writeHead(500, this.headData.contentData)
				res.end(errorJsonData)

				return
			}

			const jsonData = JSON.stringify({ accessToken: newRefresh.accessToken })

			res.setHeader(
				'Set-cookie',
				`refreshToken=${
					newRefresh?.refreshToken
				}; httpOnly; path=/api; Expires=${newRefresh.expireRefreshTokenAt.toUTCString()}; SameSite=Strict`
			)
			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from refresh controller',
				this.logger
			)
		}
	}

	async verifyAccount(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		link: string | null
	) {
		try {
			const clientUrl = process.env.CLIENT_URL
			const verifyUser = await this.authService.verifyAccount(link)
			const jsonData = JSON.stringify({ message: verifyUser.message })

			if (
				verifyUser.status === 201 &&
				clientUrl &&
				typeof clientUrl !== 'undefined'
			) {
				res.writeHead(302, {
					location: clientUrl,
				})
				res.end()

				return
			} else {
				res.writeHead(verifyUser.status, this.headData.contentData)
				res.end(jsonData)

				return
			}
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from verify-account controller',
				this.logger
			)
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
				`refreshToken=; httpOnly; path=/api; Expires=${this.expiresRemoveRefresh}; SameSite=Strict`
			)
			res.writeHead(resultLogoutService.status, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from logout controller',
				this.logger
			)
		}
	}

	async getLink(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		body: RepaidVerifyDto
	): Promise<void> {
		try {
			const repaidSendMail =
				await this.emailService.repaidVerifyAccountSendEmail(body)

			const data = JSON.stringify({ message: repaidSendMail.message })

			res.writeHead(repaidSendMail.status, this.headData.contentData)
			res.end(data)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from get-link controller',
				this.logger
			)
		}
	}

	// Forget
	async getForgetLink(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		body: RepaidVerifyDto
	): Promise<void> {
		try {
			const resetSendMail = await this.emailService.forgetPasswordSendLink(body)

			const data = JSON.stringify({ message: resetSendMail.message })

			res.writeHead(resetSendMail.status, this.headData.contentData)
			res.end(data)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from get reset-link controller',
				this.logger
			)
		}
	}

	async verifyForgetPassword(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		link: string | null
	) {
		try {
			const clientProfileUrl = process.env.CLIENT_PROFILE_URL
			const verifyForgetUser = await this.authService.forgetPasswordVerify(link)
			const jsonData = JSON.stringify({ message: verifyForgetUser.message })

			if (
				verifyForgetUser.status === 201 &&
				clientProfileUrl &&
				typeof clientProfileUrl !== 'undefined'
			) {
				res.writeHead(302, {
					location: clientProfileUrl,
				})
				res.end()

				return
			} else {
				res.writeHead(verifyForgetUser.status, this.headData.contentData)
				res.end(jsonData)

				return
			}
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from verify-forget controller',
				this.logger
			)
		}
	}

	async newPassword(
		req: IncomingMessage,
		res: ServerResponse<IncomingMessage>,
		dto: Pick<ForgetDto, 'email' | 'newPassword'>
	) {
		try {
			const newUserData = await this.authService.setNewPassword(dto)
			const jsonData = JSON.stringify({ message: newUserData.message })

			res.writeHead(newUserData.status, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from new-password controller',
				this.logger
			)
		}
	}
}
