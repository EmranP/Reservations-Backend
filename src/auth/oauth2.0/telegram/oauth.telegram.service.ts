import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { v4 as uuidV4 } from 'uuid'
import type { Logger } from 'winston'
import { UserDto } from '../../../admin/users/dto/user.dto'
import { APP_OAUTH_TELEGRAM_CONFIG } from '../../../common/config/app.config'
import { AUTH_METHOD } from '../../../common/constants/enum.constant'
import { genLinks } from '../../../common/constants/link.constant'
import { isVerifyTokenError } from '../../../common/utils/app/checkType.utils'
import { ApiError } from '../../../common/utils/log/exists-error.log'
import type { AuthModel } from '../../auth.model'
import type {
	IUserAccountDto,
	IUserWithoutAccountDto,
} from '../../dto/oauth.dto'
import type { TokenService } from '../../token/token.service'
import type { IResponseTelegramApi } from '../../types/api.types'
import type { ITelegramConfigOAuth } from '../../types/common.type'
import type { IUserOAuth, TypeUserOAuthRefresh } from '../../types/types.auth'
import type { OAuthModel } from '../oauth.model'
import { OAuthService } from '../oauth.service'

export class OAuthTelegramService extends OAuthService {
	constructor(
		private model: OAuthModel,
		private service: OAuthService,
		private authModel: AuthModel,
		private tokenService: TokenService,
		private logger: Logger
	) {
		super()
	}

	private telegramBotId = APP_OAUTH_TELEGRAM_CONFIG.TELEGRAM_BOT_ID
	private telegramBotToken = APP_OAUTH_TELEGRAM_CONFIG.TELEGRAM_BOT_TOKEN

	private getTgConfig(): ApiError | ITelegramConfigOAuth {
		if (!this.telegramBotId || !this.telegramBotToken)
			return ApiError.InternalServer(
				'Error config not set telegram id or token'
			)

		const tgConfig = {
			tgId: Number(this.telegramBotId),
			tgToken: this.telegramBotToken,
		}

		return tgConfig
	}

	private tgVerifyUser(data: IResponseTelegramApi): ApiError | boolean {
		const { hash, ...payload } = data
		const tgConfig = this.getTgConfig()
		if ('message' in tgConfig) return tgConfig

		const dataCheckString = Object.keys(payload)
			.sort()
			.map(key => `${key}=${payload[key as keyof typeof payload]}`)
			.join('\n')

		const secretKey = crypto
			.createHash('sha256')
			.update(tgConfig.tgToken)
			.digest()

		const hmac = crypto
			.createHmac('sha256', secretKey)
			.update(dataCheckString)
			.digest('hex')

		return hash !== hmac
	}

	private isAuthDateValid(authDate: number): boolean {
		const now = Math.floor(Date.now() / 1000)
		const authTimestamp = Number(authDate)

		return now - authTimestamp < 86400
	}

	public async tgCallback(
		tgUser: IResponseTelegramApi,
		email: string,
		state: string
	): Promise<ApiError | IUserOAuth> {
		if (!this.defaultUserPass)
			return ApiError.InternalServer(
				'App-config is not set default-pass for user'
			)

		if (!this.isAuthDateValid(tgUser.auth_date)) {
			throw new Error('Telegram auth data is expired')
		}

		const isTgVerify = this.tgVerifyUser(tgUser)

		if (typeof isTgVerify === 'object' && 'message' in isTgVerify)
			return isTgVerify

		if (!isTgVerify) return ApiError.BadRequest('Telegram user is not verify!')

		const user = await this.authModel.getUserByEmail(email)
		const { resetPassLink } = genLinks(uuidV4)
		const newHashPass = await bcrypt.hash(this.defaultUserPass, 10)

		if (email === user?.email) {
			const tokens = await this.tokenService.generateTokens({
				id: user.id,
				role: user.role,
			})

			if (
				!tokens ||
				typeof tokens.refresh !== 'string' ||
				typeof tokens.access !== 'string'
			)
				return ApiError.InternalServer('Error refresh-token is not generate')

			const hashAccess = await bcrypt.hash(tokens.access, 10)
			const hashRefresh = await bcrypt.hash(tokens.refresh, 10)

			const expiresTokenAt = this.isExpireUtil(
				this.maxAgeRefresh,
				this.expireRefreshJwtUnitCase
			)

			const dataUpdateTgDto: IUserAccountDto & IUserWithoutAccountDto = {
				provider: 'telegram',
				types: 'openid-connect',
				accessToken: hashAccess,
				refreshToken: hashRefresh,
				expiresIn: expiresTokenAt,
				firstName: tgUser.first_name,
				email: user.email,
				phone: '+993',
				password: user.password ?? newHashPass,
				picture: tgUser.photo_url,
				isVerify: user.is_verify,
				authMethod: AUTH_METHOD.TELEGRAM,
			}

			const updateUserTg = await this.model.updateUserOAuth(
				user.id,
				resetPassLink,
				dataUpdateTgDto
			)

			if (!updateUserTg?.id || !updateUserTg)
				return ApiError.InternalServer('Error from update account for user!')

			const userTg = new UserDto(updateUserTg)

			if (!userTg.id)
				return ApiError.InternalServer('Error transform user-telegram dto')

			const newSession = await this.tokenService.saveToken(
				userTg.id,
				hashRefresh,
				expiresTokenAt,
				state
			)

			if (
				typeof newSession === 'object' &&
				newSession !== null &&
				'message' in newSession
			)
				return ApiError.InternalServer(newSession.message)

			return {
				user: userTg,
				accessToken: tokens.access,
				refreshToken: tokens.refresh,
				expiresIn: expiresTokenAt,
			}
		} else {
			if (!email) return ApiError.BadRequest('User not write email!')

			const dataCreateTgDto: IUserAccountDto & IUserWithoutAccountDto = {
				firstName: tgUser.first_name,
				email: email,
				phone: '+993',
				password: newHashPass,
				picture: tgUser.photo_url,
				isVerify: false,
				authMethod: AUTH_METHOD.TELEGRAM,
				provider: 'telegram',
				types: 'openid-connect',
				accessToken: null,
				refreshToken: null,
				refreshIv: null,
				refreshTag: null,
				expiresIn: null,
			}

			const newTgUser = await this.createOAuth(
				this.model,
				this.tokenService,
				dataCreateTgDto,
				resetPassLink,
				AUTH_METHOD.TELEGRAM,
				state
			)

			if ('message' in newTgUser) return newTgUser

			return {
				...newTgUser,
			}
		}
	}

	public async refreshToken(
		token: string
	): Promise<TypeUserOAuthRefresh | ApiError> {
		const isVerifyToken = await this.tokenService.verifyToken(token)

		if (isVerifyTokenError(isVerifyToken))
			return ApiError.BadRequest(isVerifyToken.message)

		if (!isVerifyToken.sub || typeof isVerifyToken.role === 'undefined')
			return ApiError.BadRequest('ID or Role is not have from verify token')

		const user = await this.authModel.getUserById(isVerifyToken.sub)

		if (!user) return ApiError.NotFound('User not founded!')

		const tokens = await this.tokenService.generateTokens({
			id: user.id,
			role: user.role,
		})

		if (
			!tokens.refresh ||
			typeof tokens.refresh !== 'string' ||
			typeof tokens.access !== 'string'
		)
			return ApiError.InternalServer('Error refresh-token is not generate')

		const hashRefresh = await bcrypt.hash(tokens.refresh, 10)

		const expireRefreshTokenAt = this.isExpireUtil(
			this.maxAgeRefresh,
			this.expireRefreshJwtUnitCase
		)
		const newSession = await this.tokenService.saveToken(
			user.id,
			hashRefresh,
			expireRefreshTokenAt
		)

		if (
			typeof newSession === 'object' &&
			newSession !== null &&
			'message' in newSession
		)
			return ApiError.InternalServer(newSession.message)

		return {
			accessToken: tokens.access,
			refreshToken: tokens.refresh,
			expiresIn: expireRefreshTokenAt,
		}
	}
}
