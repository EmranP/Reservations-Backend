import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger } from 'winston'
import type { IRequestUserApp } from '../auth/types/token.type'
import { BaseConfig } from '../common/abstract/base-config.common'
import type { IAppQueryParams } from '../common/types/app/app.type'
import {
	responseBadRequest,
	responseInternalServer,
} from '../common/utils/app/errorResponse.utils'
import type { OrderService } from './order.service'
import type { CreateOrderDto } from './pipe/create.dto'
import type { EditOrderDto } from './pipe/edit.dto'

export class OrderController extends BaseConfig {
	constructor(private service: OrderService, private logger: Logger) {
		super()
	}

	async createOrder(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		body: CreateOrderDto
	): Promise<void> {
		try {
			const userId = req.user?.sub
			const userRole = req.user?.role

			const resultCreateOrder = await this.service.addOrder(
				userId,
				userRole,
				body
			)

			if ('status' in resultCreateOrder) {
				await responseBadRequest(
					resultCreateOrder.message,
					res,
					resultCreateOrder.status
				)

				return
			}

			const jsonData = JSON.stringify(resultCreateOrder)

			res.writeHead(201, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from add order!',
				this.logger
			)
		}
	}

	async getAllOrders(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const userId = req.user?.sub
			const userRole = req.user?.role
			const page = Number(query.queryParams?.page) || 1
			const limit = Number(query.queryParams?.limit) || 10
			const offset = (page - 1) * limit
			const resultGetAllOrders = await this.service.findAllOrders(
				userId,
				userRole,
				limit,
				offset
			)

			if ('message' in resultGetAllOrders) {
				await responseBadRequest(
					resultGetAllOrders.message,
					res,
					resultGetAllOrders.status
				)

				return
			}

			const jsonData = JSON.stringify(resultGetAllOrders)

			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from get-all orders!',
				this.logger
			)
		}
	}

	async getOrderById(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const userId = req.user?.sub
			const userRole = req.user?.role
			const orderId = query.queryParams?.orderId
			const resultGetOrder = await this.service.findOneOrder(
				orderId,
				userId,
				userRole
			)

			if ('message' in resultGetOrder) {
				await responseBadRequest(
					resultGetOrder.message,
					res,
					resultGetOrder.status
				)

				return
			}

			const jsonData = JSON.stringify(resultGetOrder)

			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from get-one orders!',
				this.logger
			)
		}
	}

	async updateOrder(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams,
		body: EditOrderDto
	): Promise<void> {
		try {
			const userId = req.user?.sub
			const userRole = req.user?.role
			const orderId = query.queryParams?.orderId
			const resultEditOrder = await this.service.editOrder(
				orderId,
				userId,
				userRole,
				body
			)

			if ('status' in resultEditOrder) {
				await responseBadRequest(
					resultEditOrder.message,
					res,
					resultEditOrder.status
				)

				return
			}

			const jsonData = JSON.stringify(resultEditOrder)

			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from edit order!',
				this.logger
			)
		}
	}

	async deleteOrderById(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const userId = req.user?.sub
			const userRole = req.user?.role
			const orderId = query.queryParams?.orderId
			const resultDeleteOrder = await this.service.removeOrder(
				orderId,
				userId,
				userRole
			)

			if ('status' in resultDeleteOrder) {
				await responseBadRequest(
					resultDeleteOrder.message,
					res,
					resultDeleteOrder.status
				)

				return
			}

			const jsonData = JSON.stringify(resultDeleteOrder)

			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from delete order!',
				this.logger
			)
		}
	}
}
