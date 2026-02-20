import type sharp from 'sharp'
import type { Logger } from 'winston'
import { pool } from '../../app/check-db.app'
import { ROLES } from '../../app/enums'
import { APP_CONFIG, APP_UNIT_TIME_CONFIG } from '../config/app.config'
import { TOKEN_CONFIG } from '../config/token.config'
import {
	setListRedisClientWIthEx,
	setRedisCLient,
} from '../redis/utils/grud-redis.util'
import type { IAppCountShared, IAppMessage } from '../types/app/app.type'
import type { RedisEntityMapType } from '../types/app/redis.types'
import {
	setHoursUtil,
	setMinuteUtil,
	setSecundUtil,
} from '../utils/app/date.util'
import { responseErrorDB } from '../utils/app/errorResponse.utils'
import { writeHeadData } from '../utils/app/writeHeadData.utils'
import type { ApiError } from '../utils/log/exists-error.log'

export abstract class BaseConfig {
	// Config
	protected refreshConfig = TOKEN_CONFIG.REFRESH_EXPIRE
	protected verifyConfig: string | undefined = APP_CONFIG.EXPIRES_USER_VERIFY
	protected verifyRemoveConfig: string | undefined =
		APP_CONFIG.EXPIRES_USER_REMOVE_VERIFY
	protected forgetConfig: string | undefined =
		APP_CONFIG.EXPIRES_USER_RESET_PASSWORD_VERIFY
	protected twoFactoryConfig: string | undefined =
		APP_CONFIG.EXPIRES_USER_TWO_FACTORY_CHALLENGE
	// Expire =============================
	protected expiresVerify: Date | null = null
	protected expiresRemoveVerify: Date | null = null
	protected expiresRemoveRefresh = new Date(0).toUTCString()
	protected expireS3Image = 60 * 60 * 24 * 7
	protected expiresVerifyUnitCase =
		APP_UNIT_TIME_CONFIG.EXPIRES_USER_VERIFY_UNIT_CASE
	protected expiresRemoveVerifyUnitCase =
		APP_UNIT_TIME_CONFIG.EXPIRES_USER_REMOVE_VERIFY_UNIT_CASE
	protected expiresResetPasswordVerifyUnitCase =
		APP_UNIT_TIME_CONFIG.EXPIRES_USER_RESET_PASSWORD_VERIFY_UNIT_CASE
	protected expireTwoFactoryUnitCase =
		APP_UNIT_TIME_CONFIG.EXPIRES_USER_TWO_FACTORY_CHALLENGE_UNIT_CASE
	protected expireAccessJwtUnitCase =
		APP_UNIT_TIME_CONFIG.JWT_ACCESS_EXPIRES_UNIT_CASE
	protected expireRefreshJwtUnitCase =
		APP_UNIT_TIME_CONFIG.JWT_REFRESH_EXPIRES_UNIT_CASE
	// Age ================================
	protected maxAgeVerify: number | undefined =
		Number(this.verifyConfig) || undefined
	protected maxAgeRemoveVerify: number | undefined =
		Number(this.verifyRemoveConfig) || undefined
	protected maxAgeResetVerify: number | undefined =
		Number(this.forgetConfig) || undefined
	protected maxAgeRefresh: number | undefined =
		Number(this.refreshConfig) || undefined
	protected maxAgeTwoFactoryCode: number | undefined =
		Number(this.twoFactoryConfig) || undefined
	// Flags ===============================
	protected isFirstSendEmailVerifyAccount: boolean = true
	protected isFirstSendEmailForgetPassword: boolean = true
	protected isFirstVerifyForgetPassword: boolean = true
	protected isFirstSendEmailTwoFactoryCode: boolean = true
	// Message =============================
	protected expireMessage: string = `Please confirm your account verify the link, you have ${this.verifyConfig}${this.expiresVerifyUnitCase} to do this.`
	protected errorExpireMessage: string = `Unfortunately, your confirmation time has expired, Do you wants again send email if you not verify time has ${this.expiresRemoveVerifyUnitCase}${this.expiresRemoveVerifyUnitCase}. Please register again.`
	protected errorAgainExpireMessage: string =
		'Unfortunately, your confirmation time has expired, please register again.'
	protected expireTwoFactoryCodeMessage: string = `Your email send two factory code. Please confirm him you have ${this.maxAgeTwoFactoryCode}${this.expireTwoFactoryUnitCase}`
	protected expireTwoFactoryNotCompleted: string =
		'The time for entry has not yet expired.'
	protected errorExpireTwoFactoryCodeMessage: string =
		'Your confirmation two factory code time has expired.'
	// Utils ================================
	protected headData = writeHeadData(400)
	protected clientGrantTypeRefresh = 'refresh_token'
	protected defaultUserPass = APP_CONFIG.USER_DEFAULT_PASS
	protected devMode = 'development'
	protected mode = APP_CONFIG.MODE
	protected pathAssets = '../../assets'
	protected isAdminHandler = (role: number): boolean => role === ROLES.ADMIN
	// Validate size =========================
	protected MAX_FILE_SIZE = 5 * 1024 * 1024
	protected MIN_SIZE = 200
	protected MAX_SIZE = 2048
	protected ASPECT_RATIO = 1
	// Redis Keys ============================
	protected keysRooms = 'rooms'
	protected keysRoomsIds = 'rooms:id'
	protected keysUsers = 'admin:users'
	protected keysUsersIds = 'users:id'
	protected keysOrdersUser = 'orders:user'
	protected keysOrderUserId = 'orders:user:id'
	protected keysOrdersUserCount = 'orders:user:count'
	protected keysOrdersAdmin = 'orders:admin'
	protected keysOrderAdminId = 'orders:admin:id'
	protected keysOrdersAdminCount = 'orders:admin:count'
	protected keysPaymentUser = 'payment:user'
	protected keysPaymentUserId = 'payment:user:id'
	protected keysPaymentUserCount = 'payment:user:count'
	protected keysPaymentAdmin = 'payment:admin'
	protected keysPaymentAdminId = 'payment:admin:id'
	protected keysPaymentAdminCount = 'payment:admin:count'
	// Method ================================
	protected validateImageFile(
		size: number | undefined,
		format: keyof sharp.FormatEnum,
		width: number,
		height: number,
		logger: Logger
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

		if (width > 2500 || height > 1500) {
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

	protected isExpireUtil(
		maxAge: number | undefined,
		unitCase: string | undefined,
		hourTime: number = 1
	) {
		return maxAge && unitCase === 's'
			? setSecundUtil(maxAge)
			: maxAge && unitCase === 'm'
			? setMinuteUtil(maxAge)
			: setHoursUtil(maxAge ?? hourTime)
	}

	protected logInfoCache(
		orderUserId: number | ApiError | undefined,
		orderAdminId: number | ApiError | undefined,
		logger: Logger
	): void {
		if (typeof orderUserId === 'object' && 'status' in orderUserId) {
			logger.warn(orderUserId.message)
		} else if (typeof orderAdminId === 'object' && 'status' in orderAdminId) {
			logger.warn(orderAdminId.message)
		}
	}

	protected async getModelCount(
		table: string,
		logger: Logger,
		where: string | null = null,
		whereValue: string | number | null = null
	): Promise<number | null> {
		try {
			const query = where
				? `SELECT COUNT(*) FROM ${table} WHERE ${where} = $1`
				: `SELECT COUNT(*) FROM ${table}`
			const result = where
				? await pool.query(query, [whereValue])
				: await pool.query<IAppCountShared>(query)

			if (!result.rows[0]?.count) return null

			return Number(result.rows[0].count)
		} catch (error) {
			const errorMessage = responseErrorDB(
				logger,
				error,
				'Error get-all counts to rooms:'
			)

			return errorMessage
		}
	}

	protected async updateCache<
		K extends keyof RedisEntityMapType,
		T extends RedisEntityMapType[K]
	>(
		count: number | null,
		isAdmin: boolean,
		getAllData: T,
		keysUser: string,
		keysUserId: string,
		keysUserCount: string,
		keysAdmin: string,
		keysAdminId: string,
		keysAdminCount: string,
		logger: Logger
	) {
		let addNewUsersListCache: number | ApiError | undefined
		let updateUserCountCache: undefined | ApiError | string | null

		if (!isAdmin) {
			addNewUsersListCache = await setListRedisClientWIthEx<K>(
				keysUser,
				keysUserId,
				getAllData
			)

			updateUserCountCache = await setRedisCLient(keysUserCount, String(count))
		}

		const addNewAdminListCache = await setListRedisClientWIthEx(
			keysAdmin,
			keysAdminId,
			getAllData
		)
		const updateAdminCacheCount = await setRedisCLient(
			keysAdminCount,
			String(count)
		)

		if (
			typeof addNewUsersListCache === 'object' &&
			'message' in addNewUsersListCache
		) {
			logger.error('Error from add new list to users cache!')
		} else if (
			typeof addNewAdminListCache === 'object' &&
			'message' in addNewAdminListCache
		) {
			logger.error('Error from add new list to admin cache!')
		}

		if (
			updateUserCountCache &&
			typeof updateUserCountCache === 'object' &&
			'message' in updateUserCountCache
		) {
			logger.warn('Update user-count data to cache')
		} else if (
			updateAdminCacheCount &&
			typeof updateAdminCacheCount === 'object' &&
			'message' in updateAdminCacheCount
		) {
			logger.warn('Update admin-count data to cache')
		}
	}
}
