import type { IncomingMessage, ServerResponse } from 'http'
import {
	ORDER_ADD,
	ORDER_GET_BY_ID,
	ORDER_REMOVE_BY_ID,
	ORDER_UPDATE_BY_ID,
	ORDERS_GET_ALL,
} from '../common/constants/order.constant'
import type { IAppQueryParams } from '../common/types/app/app.type'
import { isRequestUserApp } from '../common/utils/app/checkType.utils'
import { responseBadRequest } from '../common/utils/app/errorResponse.utils'
import { ApiError } from '../common/utils/log/exists-error.log'
import { orderController } from './index.order'
import { isCreateOrderDto } from './pipe/create.pipe'
import { isEditOrderDto } from './pipe/edit.pipe'

export const orderRouter = async (
	isAuth: ApiError | undefined,
	path: string,
	query: IAppQueryParams,
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>,
	body: unknown
): Promise<void> => {
	if (path === ORDER_ADD && req.method === 'POST') {
		if (typeof isAuth !== 'undefined' && 'message' in isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}

		if (!isCreateOrderDto(body)) {
			await responseBadRequest('Invalid-data from add new order!', res)

			return
		}

		await orderController.createOrder(req, res, body)
	} else if (
		path === `${ORDERS_GET_ALL}${query.searchParams}` &&
		req.method === 'GET'
	) {
		if (typeof isAuth !== 'undefined' && 'message' in isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}

		await orderController.getAllOrders(req, res, query)
	} else if (
		path === `${ORDER_GET_BY_ID}${query.searchParams}` &&
		req.method === 'GET'
	) {
		if (typeof isAuth !== 'undefined' && 'message' in isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}

		await orderController.getOrderById(req, res, query)
	} else if (
		path === `${ORDER_UPDATE_BY_ID}${query.searchParams}` &&
		req.method === 'PATCH'
	) {
		if (typeof isAuth !== 'undefined' && 'message' in isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}

		if (!isEditOrderDto(body)) {
			await responseBadRequest('Invalid-data from edit-order!', res)

			return
		}

		await orderController.updateOrder(req, res, query, body)
	} else if (
		path === `${ORDER_REMOVE_BY_ID}${query.searchParams}` &&
		req.method === 'DELETE'
	) {
		if (typeof isAuth !== 'undefined' && 'message' in isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}

		await orderController.deleteOrderById(req, res, query)
	} else {
		const apiError = ApiError.BadRequest('Bad-request from order router')

		await responseBadRequest(apiError.message, res)
	}
}
