import type { Logger } from 'winston'
import type { UserModel } from '../admin/users/user.model'
import { ROLES } from '../app/enums'
import { BaseConfig } from '../common/abstract/base-config.common'
import { APP_REDIS_CONFIG } from '../common/config/app.config'
import { DB_TABLE_ORDERS } from '../common/constants/table-db.constant'
import { checkCacheRedisClient } from '../common/redis/utils/check-cache.util'
import {
	delHashRedisClient,
	getAllListRedisClient,
	getRedisClientHashKey,
	setHashRedisClientWithEx,
	setListRedisClientWIthEx,
} from '../common/redis/utils/grud-redis.util'
import type {
	IAppMessage,
	IGetAllDataWithMeta,
} from '../common/types/app/app.type'
import { ApiError } from '../common/utils/log/exists-error.log'
import { OrderDto, type IOrderDto } from './dto/order.dto'
import type { OrderModel } from './order.model'
import type { CreateOrderDto } from './pipe/create.dto'
import type { EditOrderDto } from './pipe/edit.dto'

export class OrderService extends BaseConfig {
	private isAdminHandler = (role: number): boolean => role === ROLES.ADMIN

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
		if (!userId || typeof role === 'undefined')
			return ApiError.UnauthorizedError()

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

		const getAllOrders = await this.model.getAllOrders(user.id, isAdmin, 10, 0)

		if (getAllOrders?.length) {
			const addNewOrderListCache = setListRedisClientWIthEx(
				isAdmin ? this.keysOrdersAdmin : this.keysOrdersUser,
				isAdmin ? this.keysOrderAdminId : this.keysOrderUserId,
				getAllOrders
			)

			if (
				typeof addNewOrderListCache === 'object' &&
				'message' in addNewOrderListCache
			) {
				this.logger.error('Error from add new list-orders to cache!')
			}
		}

		return {
			message: `Order success created: ID-${newOrder.id}`,
		}
	}

	async findAllOrders(
		userId: string | undefined,
		role: number | undefined,
		limit: number = 10,
		offset: number = 0
	): Promise<IGetAllDataWithMeta<IOrderDto> | ApiError> {
		if (!userId || typeof role === 'undefined')
			return ApiError.UnauthorizedError()

		const isAdmin = this.isAdminHandler(ROLES.ADMIN)
		const getListOrdersCache = await getAllListRedisClient(
			isAdmin ? this.keysOrdersAdmin : this.keysOrdersUser,
			isAdmin ? this.keysOrderAdminId : this.keysOrderUserId,
			limit,
			offset
		)
		const allOrders = await checkCacheRedisClient(
			getListOrdersCache,
			() => this.model.getAllOrders(userId, isAdmin, limit, offset),
			'Orders success get from cache!',
			'Orders success get from database!'
		)
		const total = await this.getModelCount(DB_TABLE_ORDERS)

		if (!allOrders?.length || !total)
			return ApiError.NotFound('Orders is not founded!')

		if (!getListOrdersCache.length) {
			const addListOrders = await setListRedisClientWIthEx(
				isAdmin ? this.keysOrdersAdmin : this.keysOrdersUser,
				isAdmin ? this.keysOrderAdminId : this.keysOrderUserId,
				allOrders
			)

			if (typeof addListOrders === 'object' && 'message' in addListOrders) {
				this.logger.error('Error from add new list-orders to cache!')
			}
		}

		const allOrdersDto = allOrders.map(order => new OrderDto(order).toPlain())

		return {
			data: allOrdersDto,
			meta: {
				limit,
				offset,
				total,
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

		const isAdmin = this.isAdminHandler(ROLES.ADMIN)
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

		if (!getOneOrder) return ApiError.NotFound('Room not founded!')

		if (!getOrderByIdCache) {
			const addNewOrderById = await setHashRedisClientWithEx(
				isAdmin ? this.keysOrderAdminId : this.keysOrderUserId,
				getOneOrder.id,
				JSON.stringify(getOneOrder),
				APP_REDIS_CONFIG.ONE_DAY_EXPIRES_TIME_REDIS
			)

			if (typeof addNewOrderById === 'object' && 'status' in addNewOrderById) {
				this.logger.warn(addNewOrderById.message)
			}

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

		const isAdmin = this.isAdminHandler(ROLES.ADMIN)
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
				const updateCacheListOrders = await setListRedisClientWIthEx(
					isAdmin ? this.keysOrdersAdmin : this.keysOrdersUser,
					isAdmin ? this.keysOrderAdminId : this.keysOrderUserId,
					getAllOrders
				)

				if (
					typeof updateCacheListOrders === 'object' &&
					'message' in updateCacheListOrders
				) {
					this.logger.warn('Add new data order to cache')
				}
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
		if (!orderId) return ApiError.NotFound('Order not founded!')

		if (!userId || typeof role === 'undefined')
			return ApiError.NotFound('User-data not founded!')

		const isAdmin = this.isAdminHandler(ROLES.ADMIN)
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
			return ApiError.InternalServer(`Error from edit-room: ID-${orderId}`)

		try {
			const getAllOrders = await this.model.getAllOrders(userId, isAdmin, 10, 0)

			if (resultRemoveOrder.id) {
				const deleteOneOrderCache = await delHashRedisClient(
					isAdmin ? this.keysOrderAdminId : this.keysOrderUserId,
					orderId
				)

				if (!deleteOneOrderCache) {
					this.logger.error('Error order-data from cache not success remove!')
				}
			}

			if (getAllOrders?.length) {
				const updateCacheListOrders = await setListRedisClientWIthEx(
					isAdmin ? this.keysOrderAdminId : this.keysOrderUserId,
					isAdmin ? this.keysOrderAdminId : this.keysOrderUserId,
					getAllOrders
				)

				if (
					typeof updateCacheListOrders === 'object' &&
					'message' in updateCacheListOrders
				) {
					this.logger.warn('Update-list orders-data to cache')
				}
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
