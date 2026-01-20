import type sharp from 'sharp'
import { APP_CONFIG } from '../config/app.config'
import { TOKEN_CONFIG } from '../config/token.config'
import type { IAppMessage } from '../types/app/app.type'
import { writeHeadData } from '../utils/app/writeHeadData.utils'
import { logger } from '../utils/log/logger.log'

export abstract class BaseConfig {
	protected refreshConfig = TOKEN_CONFIG.REFRESH_EXPIRE
	protected verifyConfig: string | undefined = APP_CONFIG.EXPIRES_USER_VERIFY
	protected verifyRemoveConfig: string | undefined =
		APP_CONFIG.EXPIRES_USER_REMOVE_VERIFY
	protected forgetConfig: string | undefined =
		APP_CONFIG.EXPIRES_USER_RESET_PASSWORD_VERIFY
	protected twoFactoryConfig: string | undefined =
		APP_CONFIG.EXPIRES_USER_TWO_FACTORY_CHALLENGE
	// Expire
	// protected expiresForgetVerify: Date | null = null
	protected expiresVerify: Date | null = null
	protected expiresRemoveVerify: Date | null = null
	protected expiresRemoveRefresh = new Date(0).toUTCString()
	// Age
	protected maxAgeVerify: number =
		this.verifyConfig === '2m' ? 2 : this.verifyConfig === '5m' ? 5 : 0
	protected maxAgeRemoveVerify: number =
		this.verifyRemoveConfig === '1h' ? 1 : 0
	// ? Change time value when completed this feature auth
	protected maxAgeResetVerify: number = this.forgetConfig === '30m' ? 1 : 5
	protected maxAgeRefresh =
		this.refreshConfig === '7d' ? 7 : this.refreshConfig === '30d' ? 30 : 2
	protected maxAgeTwoFactoryCode = this.twoFactoryConfig === '60s' ? 60 : 0
	// Flags
	protected isFirstSendEmailVerifyAccount: boolean = true
	protected isFirstSendEmailForgetPassword: boolean = true
	protected isFirstVerifyForgetPassword: boolean = true
	protected isFirstSendEmailTwoFactoryCode: boolean = true
	// Message
	protected expireMessage: string = `Please confirm your account verify the link, you have ${
		this.verifyConfig === '2m' ? 2 : 1
	} minutes to do this.`
	protected errorExpireMessage: string =
		'Unfortunately, your confirmation time has expired, Do you wants again send email if you not verify time has 1 hour. Please register again.'
	protected errorAgainExpireMessage: string =
		'Unfortunately, your confirmation time has expired, please register again.'
	protected expireTwoFactoryCodeMessage: string = `Your email send two factory code. Please confirm him you have ${this.maxAgeTwoFactoryCode} secund`
	protected expireTwoFactoryNotCompleted: string =
		'The time for entry has not yet expired.'
	protected errorExpireTwoFactoryCodeMessage: string =
		'Your confirmation two factory code time has expired.'
	// Utils
	protected headData = writeHeadData(400)
	protected clientGrantTypeRefresh = 'refresh_token'
	protected defaultUserPass = APP_CONFIG.USER_DEFAULT_PASS
	protected devMode = 'development'
	protected mode = APP_CONFIG.MODE
	protected pathAssets = '../../assets'
	// Validate size
	protected MAX_FILE_SIZE = 5 * 1024 * 1024
	protected MIN_SIZE = 200
	protected MAX_SIZE = 2048
	protected ASPECT_RATIO = 1

	protected validateImageFile(
		size: number | undefined,
		format: keyof sharp.FormatEnum,
		width: number,
		height: number
	): IAppMessage | void {
		if (size && size > this.MAX_FILE_SIZE) {
			logger.warn('Image is too large!')

			return { message: 'Image is too large!' }
		}

		if (!format) {
			logger.warn('File data is must be type file media!')

			return { message: 'File data is must be type file media!' }
		}

		if (width < 200 || height < 200) {
			logger.warn('Image width or height is too small')

			return { message: 'Image width or height is too small' }
		}

		if (width > 2048 || height > 2048) {
			logger.warn('Image width or height is too large')

			return { message: 'Image width or height is too large' }
		}

		//? Optional validate
		// const ratio = width / height
		// if (Math.abs(ratio - 1) > 0.05) {
		// 	this.logger.warn('Image must be square')

		// 	return ApiError.BadRequest('Image must be square')
		// }
	}
}
