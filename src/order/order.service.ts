import type { Logger } from 'winston'
import type { UserModel } from '../admin/users/user.model'
import { BaseConfig } from '../common/abstract/base-config.common'
import { APP_REDIS_CONFIG } from '../common/config/app.config'
import { DB_TABLE_ORDERS } from '../common/constants/table-db.constant'
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
import { OrderDto } from './dto/order.dto'
import type { OrderModel } from './order.model'
import type { CreateOrderDto } from './pipe/create.pipe'
import type { EditOrderDto } from './pipe/edit.pipe'
import type { IOrderDto } from './types/dto.interface'

export class OrderService extends BaseConfig {
	constructor(
		private model: OrderModel,
		private userModel: UserModel,
		private logger: Logger
	) {
		super()
	}

	async addOrder(
		userId: string | undefined,
		role: number | undefined,
		dto: CreateOrderDto
	): Promise<IAppMessage | ApiError> {
		const now = new Date()
		if (!userId || typeof role === 'undefined')
			return ApiError.UnauthorizedError()

		if (
			dto.residenceTime &&
			now.getTime() > new Date(dto.residenceTime).getTime()
		)
			return ApiError.BadRequest(`You can't book at this time.`)

		const isAdmin = this.isAdminHandler(role)
		const getUserCache = await getRedisClientHashKey(this.keysUsersIds, userId)
		const user = await checkCacheRedisClient(
			getUserCache,
			() => this.userModel.getUserByIdModel(userId),
			'User get from cache',
			'User get from database'
		)

		if (!user) return ApiError.NotFound('User not founded from db!')

		const newOrder = await this.model.createOrder(user.id, dto)

		if (!newOrder)
			return ApiError.InternalServer('Error from created new order!')

		const ordersCount = await this.getModelCount(
			DB_TABLE_ORDERS,
			this.logger,
			!isAdmin ? 'user_id' : null,
			!isAdmin ? userId : null
		)
		const getAllOrders = await this.model.getAllOrders(user.id, isAdmin, 10, 0)
		if (getAllOrders?.length) {
			await this.updateCache(
				ordersCount,
				isAdmin,
				getAllOrders,
				this.keysOrdersUser,
				this.keysOrderUserId,
				this.keysOrdersUserCount,
				this.keysOrdersAdmin,
				this.keysOrderAdminId,
				this.keysOrdersAdminCount,
				this.logger
			)
		}

		return {
			message: `Order success created: ID-${newOrder.id}`,
		}
	}

	async findAllOrders(
		userId: string | undefined,
		role: number | undefined,
		limit: number = 10,
		limitCache: number,
		offset: number = 0
	): Promise<IGetAllDataWithMeta<IOrderDto> | ApiError> {
		if (!userId || typeof role === 'undefined')
			return ApiError.UnauthorizedError()

		const isAdmin = this.isAdminHandler(role)
		const getListOrdersCache = await getAllListRedisClient(
			isAdmin ? this.keysOrdersAdmin : this.keysOrdersUser,
			isAdmin ? this.keysOrderAdminId : this.keysOrderUserId,
			limitCache,
			offset
		)
		const getTotalOrdersCache = await getRedisClientKey(
			isAdmin ? this.keysOrdersAdminCount : this.keysOrdersUserCount
		)
		const allOrders = await checkCacheRedisClient(
			getListOrdersCache,
			() => this.model.getAllOrders(userId, isAdmin, limit, offset),
			'Orders success get from cache!',
			'Orders success get from database!'
		)
		const totalOrders = await checkCacheRedisClient(
			getTotalOrdersCache,
			() =>
				this.getModelCount(
					DB_TABLE_ORDERS,
					this.logger,
					!isAdmin ? 'user_id' : null,
					!isAdmin ? userId : null
				),
			'Orders-count success get from cache!',
			'Orders-count success get from database!'
		)

		if (!allOrders?.length || !totalOrders)
			return ApiError.NotFound('Orders is not founded!')

		if (!getListOrdersCache.length) {
			await this.updateCache(
				totalOrders,
				isAdmin,
				allOrders,
				this.keysOrdersUser,
				this.keysOrderUserId,
				this.keysOrdersUserCount,
				this.keysOrdersAdmin,
				this.keysOrderAdminId,
				this.keysOrdersAdminCount,
				this.logger
			)
		}

		const allOrdersDto = allOrders.map(order => new OrderDto(order).toPlain())

		return {
			data: allOrdersDto,
			meta: {
				limit,
				offset,
				total: Number(totalOrders),
			},
		}
	}

	async findOneOrder(
		orderId: string | undefined,
		userId: string | undefined,
		role: number | undefined
	): Promise<IOrderDto | ApiError> {
		if (!orderId) return ApiError.NotFound('Order not founded')

		if (!userId || typeof role === 'undefined')
			return ApiError.NotFound('User-data not founded!')

		const isAdmin = this.isAdminHandler(role)
		const getOrderByIdCache = await getRedisClientHashKey(
			isAdmin ? this.keysOrderAdminId : this.keysOrderUserId,
			orderId
		)
		const getOneOrder = await checkCacheRedisClient(
			getOrderByIdCache,
			() => this.model.getByIdOrder(orderId, userId, isAdmin),
			'Get order by id from cache!',
			'Get order by id from database!'
		)

		if (!getOneOrder) return ApiError.NotFound('Order not founded!')

		if (!getOrderByIdCache) {
			let addNewOrderUserById: 1 | ApiError | undefined

			if (!isAdmin) {
				addNewOrderUserById = await setHashRedisClientWithEx(
					this.keysOrderUserId,
					getOneOrder.id,
					JSON.stringify(getOneOrder),
					APP_REDIS_CONFIG.ONE_DAY_EXPIRES_TIME_REDIS
				)
			}

			const addNewOrderAdminById = await setHashRedisClientWithEx(
				this.keysOrderAdminId,
				getOneOrder.id,
				JSON.stringify(getOneOrder),
				APP_REDIS_CONFIG.ONE_DAY_EXPIRES_TIME_REDIS
			)

			this.logInfoCache(addNewOrderUserById, addNewOrderAdminById, this.logger)

			this.logger.info(
				`New room have success added to cache: ID-${getOneOrder.id}`
			)
		}

		const orderDto = new OrderDto(getOneOrder)

		return orderDto
	}

	async editOrder(
		orderId: string | undefined,
		userId: string | undefined,
		role: number | undefined,
		dto: EditOrderDto
	): Promise<IAppMessage | ApiError> {
		if (!orderId) return ApiError.NotFound('Order not founded!')

		if (!userId || typeof role === 'undefined')
			return ApiError.NotFound('User-data not founded!')

		const isAdmin = this.isAdminHandler(role)
		const getOrderByIdCache = await getRedisClientHashKey(
			isAdmin ? this.keysOrderAdminId : this.keysOrderUserId,
			orderId
		)
		const getOneOrder = await checkCacheRedisClient(
			getOrderByIdCache,
			() => this.model.getByIdOrder(orderId, userId, isAdmin),
			'Get order by id from cache!',
			'Get order by id from database!'
		)

		if (!getOneOrder) return ApiError.NotFound('Order not founded!')

		const resultEditOrder = await this.model.updateOrder(
			getOneOrder.id,
			userId,
			isAdmin,
			dto
		)

		if (!resultEditOrder)
			return ApiError.InternalServer(`Error from edit-room: ID-${orderId}`)

		try {
			const getAllOrders = await this.model.getAllOrders(userId, isAdmin, 10, 0)

			if (getAllOrders?.length) {
				let updateUserCacheListOrders: ApiError | number | undefined

				if (!isAdmin) {
					updateUserCacheListOrders = await setListRedisClientWIthEx(
						this.keysOrdersUser,
						this.keysOrderUserId,
						getAllOrders
					)
				}

				const updateAdminCacheListOrders = await setListRedisClientWIthEx(
					this.keysOrdersAdmin,
					this.keysOrderAdminId,
					getAllOrders
				)

				this.logInfoCache(
					updateUserCacheListOrders,
					updateAdminCacheListOrders,
					this.logger
				)
			}
		} catch (error) {
			this.logger.warn(
				`Update room is not success safe to cache: ID-${getOneOrder.id}`
			)
		}

		return {
			message: `Order have success update: ID-${resultEditOrder.id}`,
		}
	}

	async removeOrder(
		orderId: string | undefined,
		userId: string | undefined,
		role: number | undefined
	): Promise<IAppMessage | ApiError> {
		if (!orderId) return ApiError.NotFound('Order-ID not founded!')

		if (!userId || typeof role === 'undefined')
			return ApiError.NotFound('User-data not founded!')

		const isAdmin = this.isAdminHandler(role)
		const getOrderByIdCache = await getRedisClientHashKey(
			isAdmin ? this.keysOrderAdminId : this.keysOrderUserId,
			orderId
		)
		const getOneOrder = await checkCacheRedisClient(
			getOrderByIdCache,
			() => this.model.getByIdOrder(orderId, userId, isAdmin),
			'Get order by id from cache!',
			'Get order by id from database!'
		)

		if (!getOneOrder) return ApiError.NotFound('Order not founded!')

		const resultRemoveOrder = await this.model.deleteOrder(
			getOneOrder.id,
			userId,
			isAdmin
		)

		if (!resultRemoveOrder)
			return ApiError.InternalServer(`Error from delete-room: ID-${orderId}`)

		try {
			const getAllOrders = await this.model.getAllOrders(userId, isAdmin, 10, 0)
			const ordersCount = await this.getModelCount(
				DB_TABLE_ORDERS,
				this.logger,
				!isAdmin ? 'user_id' : null,
				!isAdmin ? userId : null
			)

			if (resultRemoveOrder.id) {
				let deleteOneUserOrderCache: undefined | number | ApiError

				if (!isAdmin) {
					deleteOneUserOrderCache = await delHashRedisClient(
						this.keysOrderUserId,
						resultRemoveOrder.id
					)
				}

				const deleteOneOrderCache = await delHashRedisClient(
					this.keysOrderAdminId,
					resultRemoveOrder.id
				)

				if (!deleteOneOrderCache) {
					this.logger.error(
						'Error admin order-data from cache not success remove!'
					)
				} else if (!deleteOneUserOrderCache) {
					this.logger.error(
						'Error user order-data from cache not success remove!'
					)
				}
			}

			if (getAllOrders && getAllOrders.length) {
				await this.updateCache(
					ordersCount,
					isAdmin,
					getAllOrders,
					this.keysOrdersUser,
					this.keysOrderUserId,
					this.keysOrdersUserCount,
					this.keysOrdersAdmin,
					this.keysOrderAdminId,
					this.keysOrdersAdminCount,
					this.logger
				)
			}
		} catch (error) {
			this.logger.warn(
				`Update order is not success safe to cache: ID-${resultRemoveOrder.id}`
			)
		}

		return {
			message: `Order have success delete: ID-${resultRemoveOrder.id}`,
		}
	}
}
