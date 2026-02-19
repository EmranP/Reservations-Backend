import type { IncomingMessage, ServerResponse } from 'http'
import { ROLES } from '../app/enums'
import { hasRole } from '../auth/middleware/hasRole.auth'
import {
	CANCEL_PAYMENT,
	CONFIRM_PAYMENT,
	CREATE_PAYMENT,
	DELETE_PAYMENT,
	GET_ALL_FRESH_PAYMENT,
	GET_ALL_PAYMENT,
	GET_ONE_FRESH_PAYMENT,
	GET_ONE_PAYMENT,
} from '../common/constants/payment.constant'
import type { IAppQueryParams } from '../common/types/app/app.type'
import { isRequestUserApp } from '../common/utils/app/checkType.utils'
import { responseBadRequest } from '../common/utils/app/errorResponse.utils'
import { ApiError } from '../common/utils/log/exists-error.log'
import { paymentController } from './index.payment'
import { isCreatePaymentDto } from './pipe/payment.pipe'

export const paymentRouter = async (
	isAuth: ApiError | undefined,
	path: string,
	query: IAppQueryParams,
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>,
	body: unknown
): Promise<void> => {
	if (path === CREATE_PAYMENT && req.method === 'POST') {
		if (typeof isAuth !== 'undefined' && 'message' in isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}

		if (!isCreatePaymentDto(body)) {
			await responseBadRequest('Invalid body from create-payment', res, 400)

			return
		}

		await paymentController.createPay(req, res, body)
	} else if (
		path === `${GET_ALL_PAYMENT}${query.searchParams}` &&
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

		await paymentController.getAllPay(req, res, query)
	} else if (
		path === `${GET_ONE_PAYMENT}${query.searchParams}` &&
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

		await paymentController.getOnePay(req, res, query)
	} else if (
		path === `${GET_ALL_FRESH_PAYMENT}${query.searchParams}` &&
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

		const isAdmin = await hasRole([ROLES.ADMIN], req, res)

		if (isAdmin) {
			await responseBadRequest(isAdmin, res, 403)

			return
		}

		await paymentController.getAllPayApi(res, query)
	} else if (path === `${GET_ONE_FRESH_PAYMENT}${query.searchParams}`) {
		if (typeof isAuth !== 'undefined' && 'message' in isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}

		const isAdmin = await hasRole([ROLES.ADMIN], req, res)

		if (isAdmin) {
			await responseBadRequest(isAdmin, res, 403)

			return
		}

		await paymentController.getOnePayApi(res, query)
	} else if (
		path === `${CONFIRM_PAYMENT}${query.searchParams}` &&
		req.method === 'POST'
	) {
		if (typeof isAuth !== 'undefined' && 'message' in isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}

		const isAdmin = await hasRole([ROLES.ADMIN], req, res)

		if (isAdmin) {
			await responseBadRequest(isAdmin, res, 403)

			return
		}

		await paymentController.confirmPayApi(req, res, query)
	} else if (
		path === `${CANCEL_PAYMENT}${query.searchParams}` &&
		req.method === 'POST'
	) {
		if (typeof isAuth !== 'undefined' && 'message' in isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}

		const isAdmin = await hasRole([ROLES.ADMIN], req, res)

		if (isAdmin) {
			await responseBadRequest(isAdmin, res, 403)

			return
		}

		await paymentController.cancelPayApi(req, res, query)
	} else if (
		path === `${DELETE_PAYMENT}${query.searchParams}` &&
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

		const isAdmin = await hasRole([ROLES.ADMIN], req, res)

		if (isAdmin) {
			await responseBadRequest(isAdmin, res, 403)

			return
		}

		await paymentController.deletePay(req, res, query)
	} else {
		await responseBadRequest('Bad-request from payment router', res)
	}
}
