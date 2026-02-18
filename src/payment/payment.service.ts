import type { Logger } from 'winston'
import type { IPayment } from '../app/db/types/payment.types'
import { BaseConfig } from '../common/abstract/base-config.common'
import { APP_REDIS_CONFIG } from '../common/config/app.config'
import { DB_TABLE_PAYMENT } from '../common/constants/table-db.constant'
import { checkCacheRedisClient } from '../common/redis/utils/check-cache.util'
import {
	delHashRedisClient,
	getAllListRedisClient,
	getRedisClientHashKey,
	getRedisClientKey,
	setHashRedisClientWithEx,
	setListRedisClientWIthEx,
} from '../common/redis/utils/grud-redis.util'
import type {
	IAppMessage,
	IGetAllDataWithMeta,
} from '../common/types/app/app.type'
import { ApiError } from '../common/utils/log/exists-error.log'
import { PaymentDto } from './dto/payment.dto'
import { PaymentApi } from './payment.api'
import type { PaymentModel } from './payment.model'
import type { IPaymentPipeDto } from './pipe/payment.pipe'
import type { IResponseItemsYooKassaApi } from './types/api.interface'
import type { IPaymentDto } from './types/dto.interface'

export class PaymentService extends BaseConfig {
	private payData = (item: IResponseItemsYooKassaApi): IPayment => ({
		id: item.id,
		order_id: item.metadata.orderId,
		paid: item.paid,
		amount_value: Number(item.amount.value),
		amount_currency: item.amount.currency,
		payment_method_type: item.payment_method.type,
		payment_method_saved: item.payment_method.saved,
		refundable: item.refundable,
		test: item.test,
		status: item.status,
		description: item.description || null,
		created_at: item.created_at,
		updated_at: new Date(),
	})

	constructor(
		private model: PaymentModel,
		private payApi: PaymentApi,
		private logger: Logger
	) {
		super()
	}

	public async addPay(
		userId: string | undefined,
		role: number | undefined,
		dto: IPaymentPipeDto
	): Promise<ApiError | IResponseItemsYooKassaApi> {
		if (!userId || typeof role === 'undefined')
			return ApiError.BadRequest('User-ID not founded!')

		const isAdmin = this.isAdminHandler(role)
		const resApi = await this.payApi.createApiPay(dto)

		if ('message' in resApi) return resApi

		if (!resApi.metadata.orderId)
			return ApiError.NotFound('Not founded order-id not founded from PAY-API!')

		const newPayModel = await this.model.createPay(
			resApi.metadata.orderId,
			userId,
			resApi
		)

		if (!newPayModel)
			return ApiError.InternalServer('Payment is not success created from db')

		const totalPayCount = await this.getModelCount(
			DB_TABLE_PAYMENT,
			this.logger,
			!isAdmin ? 'user_id' : null,
			!isAdmin ? userId : null
		)
		const getAllPay = await this.model.getAllPay(userId, isAdmin, 10, 0)

		if (getAllPay?.length) {
			await this.updateCache(
				totalPayCount,
				isAdmin,
				getAllPay,
				this.keysPaymentUser,
				this.keysPaymentUserId,
				this.keysPaymentUserCount,
				this.keysPaymentAdmin,
				this.keysPaymentAdminId,
				this.keysPaymentAdminCount,
				this.logger
			)
		}

		return resApi
	}

	public async findAllPay(
		limit: number,
		limitCache: number,
		offset: number,
		userId: string | undefined,
		role: number | undefined
	): Promise<IGetAllDataWithMeta<IPaymentDto> | ApiError> {
		if (!userId || typeof role === 'undefined')
			return ApiError.NotFound('Not founded user-data!')

		const isAdmin = this.isAdminHandler(role)
		const getListPaymentCache = await getAllListRedisClient(
			isAdmin ? this.keysPaymentAdmin : this.keysPaymentUser,
			isAdmin ? this.keysPaymentAdminId : this.keysPaymentUserId,
			limitCache,
			offset
		)
		const getTotalPaymentCache = await getRedisClientKey(
			isAdmin ? this.keysPaymentAdminCount : this.keysPaymentUserCount
		)
		const allPayment = await checkCacheRedisClient(
			getListPaymentCache,
			() => this.model.getAllPay(userId, isAdmin, limit, offset),
			'Payment success get from cache!',
			'Payment success get from database!'
		)
		const totalPayCount = await checkCacheRedisClient(
			getTotalPaymentCache,
			() =>
				this.getModelCount(
					DB_TABLE_PAYMENT,
					this.logger,
					!isAdmin ? 'user_id' : null,
					!isAdmin ? userId : null
				),
			'Payment-count success get from cache!',
			'Payment-count success get from database!'
		)

		if (!allPayment?.length || !totalPayCount)
			return ApiError.NotFound('Payments not founded!')

		const paymentsDto = allPayment.map(pay => new PaymentDto(pay).toPlain())

		return {
			data: paymentsDto,
			meta: {
				limit,
				offset,
				total: Number(totalPayCount),
			},
		}
	}

	public async findOnePay(
		payId: string | undefined,
		userId: string | undefined,
		role: number | undefined
	): Promise<IPaymentDto | ApiError> {
		if (!payId) return ApiError.NotFound('Not founded Pay-ID')

		if (!userId || typeof role === 'undefined')
			return ApiError.NotFound('Not found user data')

		const isAdmin = this.isAdminHandler(role)
		const getOnePayIdCache = await getRedisClientHashKey(
			isAdmin ? this.keysPaymentAdminId : this.keysPaymentAdminId,
			payId
		)
		const getOnePay = await checkCacheRedisClient(
			getOnePayIdCache,
			() => this.model.getOnePay(payId, userId, isAdmin),
			'Get payment by id from cache!',
			'Get payment by id from database!'
		)

		if (!getOnePay) return ApiError.NotFound(`Payment not founded: ID-${payId}`)

		if (!getOnePayIdCache) {
			let addNewPayUserById: 1 | ApiError | undefined

			if (!isAdmin) {
				addNewPayUserById = await setHashRedisClientWithEx(
					this.keysPaymentUserId,
					getOnePay.id,
					JSON.stringify(getOnePay),
					APP_REDIS_CONFIG.ONE_DAY_EXPIRES_TIME_REDIS
				)
			}

			const addNewPayAdminById = await setHashRedisClientWithEx(
				this.keysPaymentAdminId,
				getOnePay.id,
				JSON.stringify(getOnePay),
				APP_REDIS_CONFIG.ONE_DAY_EXPIRES_TIME_REDIS
			)

			this.logInfoCache(addNewPayUserById, addNewPayAdminById, this.logger)

			this.logger.info(
				`New room have success added to cache: ID-${getOnePay.id}`
			)
		}

		const paymentDto = new PaymentDto(getOnePay)

		return paymentDto
	}

	public async updatePay(
		payId: string | undefined,
		userId: string | undefined,
		role: number | undefined,
		dto: PaymentDto
	): Promise<IAppMessage | ApiError> {
		if (!payId) return ApiError.NotFound('Pay-ID not founded!')

		if (!userId || typeof role === 'undefined')
			return ApiError.NotFound('User-data not founded!')

		const isAdmin = this.isAdminHandler(role)
		const existPayCache = await getRedisClientHashKey(
			isAdmin ? this.keysPaymentAdminId : this.keysPaymentUserId,
			payId
		)

		const existPay = await checkCacheRedisClient(
			existPayCache,
			() => this.model.getPayBydId(payId),
			'Get payment by id from cache!',
			'Get payment by id from database!'
		)

		if (!existPay) return ApiError.NotFound('Payment not fonded!')

		const resultUpdatePay = await this.model.editPay(existPay.id, dto)

		if (!resultUpdatePay)
			return ApiError.InternalServer('Error not success update payment!')

		try {
			const getAllPayment = await this.model.getAllPay(userId, isAdmin, 10, 0)

			if (getAllPayment?.length) {
				const updateUserCacheListPayment = await setListRedisClientWIthEx(
					this.keysPaymentUser,
					this.keysPaymentUserId,
					getAllPayment
				)
				const updateAdminCacheListPayment = await setListRedisClientWIthEx(
					this.keysPaymentAdmin,
					this.keysPaymentAdminId,
					getAllPayment
				)

				this.logInfoCache(
					updateUserCacheListPayment,
					updateAdminCacheListPayment,
					this.logger
				)
			}
		} catch (error) {
			this.logger.warn(
				`Update room is not success safe to cache: ID-${resultUpdatePay.id}`
			)
		}

		return { message: `Payment have success update: ID-${resultUpdatePay.id}` }
	}

	public async removePay(
		userId: string | undefined,
		role: number | undefined,
		payId: string | undefined
	): Promise<IAppMessage | ApiError> {
		if (!payId) return ApiError.NotFound('Pay-ID not founded!')

		if (!userId || typeof role === 'undefined')
			return ApiError.NotFound('User-data not founded!')

		const isAdmin = this.isAdminHandler(role)
		const existPayByIdCache = await getRedisClientHashKey(
			isAdmin ? this.keysPaymentAdminId : this.keysPaymentUserId,
			payId
		)
		const existPay = await checkCacheRedisClient(
			existPayByIdCache,
			() => this.model.getPayBydId(payId),
			'Get payment by id from cache!',
			'Get payment by id from database!'
		)

		if (!existPay) return ApiError.NotFound('Payment not founded!')

		const resultDeletePay = await this.model.deletePay(existPay.id)

		if (!resultDeletePay)
			return ApiError.InternalServer(
				`Error payment is not success delete: ID-${payId}`
			)

		try {
			const getAllPayment = await this.model.getAllPay(userId, isAdmin, 10, 0)
			const paymentCount = await this.getModelCount(
				DB_TABLE_PAYMENT,
				this.logger,
				!isAdmin ? 'user_id' : null,
				!isAdmin ? userId : null
			)

			if (resultDeletePay.id) {
				let deleteOneUserPaymentCache: undefined | number | ApiError

				if (!isAdmin) {
					deleteOneUserPaymentCache = await delHashRedisClient(
						this.keysPaymentUserId,
						resultDeletePay.id
					)
				}

				const deleteOnePaymentCache = await delHashRedisClient(
					this.keysPaymentAdminId,
					resultDeletePay.id
				)

				if (!deleteOnePaymentCache) {
					this.logger.error(
						'Error admin order-data from cache not success remove!'
					)
				} else if (!deleteOneUserPaymentCache) {
					this.logger.error(
						'Error user order-data from cache not success remove!'
					)
				}
			}

			if (getAllPayment && getAllPayment.length) {
				await this.updateCache(
					paymentCount,
					isAdmin,
					getAllPayment,
					this.keysPaymentUser,
					this.keysPaymentUserId,
					this.keysPaymentUserCount,
					this.keysPaymentAdmin,
					this.keysPaymentAdminId,
					this.keysPaymentAdminCount,
					this.logger
				)
			}
		} catch (error) {
			this.logger.warn(
				`Update order is not success safe to cache: ID-${resultDeletePay.id}`
			)
		}

		return { message: `Payment have success delete: ID-${resultDeletePay.id}` }
	}

	// Api
	public async findAllFreshPayApi(
		limit: number,
		cursor: string | undefined
	): Promise<IGetAllDataWithMeta<IPaymentDto> | ApiError> {
		const allPayment = await this.payApi.getAllApiPayInfo(limit, cursor)

		if ('message' in allPayment) return allPayment

		const allPaymentDto = allPayment.items.map(pay =>
			new PaymentDto(this.payData(pay)).toPlain()
		)

		return {
			data: allPaymentDto,
			meta: {
				limit,
				offset: allPayment.next_cursor || null,
			},
		}
	}

	public async findOneFreshPayApi(
		payId: string | undefined
	): Promise<IPaymentDto | ApiError> {
		if (!payId) return ApiError.NotFound('Pay-id not founded!')

		const payment = await this.payApi.getOneApiPayInfo(payId)

		if ('message' in payment) return payment

		const paymentDto = new PaymentDto(this.payData(payment))

		return paymentDto
	}

	public async confirmPayApi(
		payId: string | undefined,
		userId: string | undefined,
		role: number | undefined
	): Promise<IAppMessage | ApiError> {
		if (!payId) return ApiError.NotFound('Pay-id not founded!')

		const isConfirmPay = await this.payApi.confirmApiPay(payId)

		if ('message' in isConfirmPay) return isConfirmPay

		const paymentDto = new PaymentDto(this.payData(isConfirmPay))
		const updatePay = await this.updatePay(
			isConfirmPay.id,
			userId,
			role,
			paymentDto
		)

		if (!updatePay)
			return ApiError.InternalServer('Error update from confirm payment!')

		return {
			message: `Payment have success confirm: ID-${isConfirmPay.id}`,
		}
	}

	public async cancelPayApi(
		payId: string | undefined,
		userId: string | undefined,
		role: number | undefined
	): Promise<IAppMessage | ApiError> {
		if (!payId) return ApiError.NotFound('Pay-id not founded!')

		const isCancelPay = await this.payApi.cancelApiPay(payId)

		if ('message' in isCancelPay) return isCancelPay

		const paymentDto = new PaymentDto(this.payData(isCancelPay))
		const updatePay = await this.updatePay(
			isCancelPay.id,
			userId,
			role,
			paymentDto
		)

		if (!updatePay)
			return ApiError.InternalServer('Error update from confirm payment!')

		return {
			message: `Payment have success cancel: ID-${isCancelPay.id}`,
		}
	}
}
