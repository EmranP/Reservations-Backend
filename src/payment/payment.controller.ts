import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger } from 'winston'
import type { IRequestUserApp } from '../auth/types/token.type'
import { BaseConfig } from '../common/abstract/base-config.common'
import type { IAppQueryParams } from '../common/types/app/app.type'
import {
	responseBadRequest,
	responseInternalServer,
} from '../common/utils/app/errorResponse.utils'
import type { PaymentService } from './payment.service'
import type { IPaymentPipeDto } from './pipe/payment.pipe'

export class PaymentController extends BaseConfig {
	constructor(private service: PaymentService, private logger: Logger) {
		super()
	}

	public async getAllPay(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const userId = req.user?.sub
			const userRole = req.user?.role
			const limit = Number(query.queryParams?.limit) || 10
			const page = Number(query.queryParams?.page) || 1
			const offset = (page - 1) * limit
			const limitCache = limit + offset - 1
			const result = await this.service.findAllPay(
				limit,
				limitCache,
				offset,
				userId,
				userRole
			)

			if ('message' in result) {
				await responseBadRequest(result.message, res, result.status)

				return
			}

			res.writeHead(200, this.headData.contentData)
			res.end(JSON.stringify(result))
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from get-all payment!',
				this.logger
			)
		}
	}

	public async getOnePay(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const userId = req.user?.sub
			const userRole = req.user?.role
			const payId = query.queryParams?.payId
			const result = await this.service.findOnePay(payId, userId, userRole)

			if ('message' in result) {
				await responseBadRequest(result.message, res, result.status)

				return
			}

			res.writeHead(200, this.headData.contentData)
			res.end(JSON.stringify(result))
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from get-one payment!',
				this.logger
			)
		}
	}

	public async deletePay(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const payId = query.queryParams?.payId
			const userId = req.user?.sub
			const userRole = req.user?.role
			const resultDeletePay = await this.service.removePay(
				userId,
				userRole,
				payId
			)

			if ('status' in resultDeletePay) {
				await responseBadRequest(
					resultDeletePay.message,
					res,
					resultDeletePay.status
				)

				return
			}

			res.writeHead(200, this.headData.contentData)
			res.end(JSON.stringify(resultDeletePay))
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from delete-pay payment!',
				this.logger
			)
		}
	}

	// Api
	public async createPay(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		body: IPaymentPipeDto
	): Promise<void> {
		try {
			const userId = req.user?.sub
			const userRole = req.user?.role
			const resultNewPay = await this.service.addPay(userId, userRole, body)

			if ('message' in resultNewPay) {
				await responseBadRequest(resultNewPay.message, res, resultNewPay.status)

				return
			}

			if (resultNewPay.confirmation.confirmation_url) {
				res.writeHead(302, {
					location: resultNewPay.confirmation.confirmation_url,
				})
				res.end()

				return
			} else {
				await responseBadRequest('Return-url not founded!', res, 404)

				return
			}
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from add payment!',
				this.logger
			)
		}
	}

	public async getAllPayApi(
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const limit = Number(query.queryParams?.limit) ?? 10
			const cursor = query.queryParams?.cursor
			const allPayApi = await this.service.findAllFreshPayApi(limit, cursor)

			if ('message' in allPayApi) {
				await responseBadRequest(allPayApi.message, res, allPayApi.status)

				return
			}

			res.writeHead(200, this.headData.contentData)
			res.end(JSON.stringify(allPayApi))
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from controller fetch-all payment',
				this.logger
			)
		}
	}

	public async getOnePayApi(
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const payId = query.queryParams?.payId
			const payment = await this.service.findOneFreshPayApi(payId)
			if ('message' in payment) {
				await responseBadRequest(payment.message, res, payment.status)

				return
			}

			res.writeHead(200, this.headData.contentData)
			res.end(JSON.stringify(payment))
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from controller fetch-one payment',
				this.logger
			)
		}
	}

	public async confirmPayApi(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const payId = query.queryParams?.payId
			const userId = req.user?.sub
			const userRole = req.user?.role
			const paymentConfirm = await this.service.confirmPayApi(
				payId,
				userId,
				userRole
			)

			if ('status' in paymentConfirm) {
				await responseBadRequest(
					paymentConfirm.message,
					res,
					paymentConfirm.status
				)

				return
			}

			res.writeHead(200, this.headData.contentData)
			res.end(JSON.stringify(paymentConfirm))
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from controller fetch confirm-payment',
				this.logger
			)
		}
	}

	public async cancelPayApi(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const payId = query.queryParams?.payId
			const userId = req.user?.sub
			const userRole = req.user?.role
			const paymentCancel = await this.service.cancelPayApi(
				payId,
				userId,
				userRole
			)

			if ('status' in paymentCancel) {
				await responseBadRequest(
					paymentCancel.message,
					res,
					paymentCancel.status
				)

				return
			}

			res.writeHead(200, this.headData.contentData)
			res.end(JSON.stringify(paymentCancel))
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from controller fetch cancel-payment',
				this.logger
			)
		}
	}
}
