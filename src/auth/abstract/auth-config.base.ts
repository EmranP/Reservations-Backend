import { APP_CONFIG } from '../../common/config/app.config'
import { TOKEN_CONFIG } from '../../common/config/token.config'
import { writeHeadData } from '../../common/utils/app/writeHeadData.utils'

export abstract class AuthBaseConfig {
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
	protected maxAgeResetVerify: number = this.forgetConfig === '30m' ? 5 : 5
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
}
