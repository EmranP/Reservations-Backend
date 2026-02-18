import { v4 as uuid4 } from 'uuid'
import { APP_PAYMENT_CONFIG } from '../common/config/app.config'
import { API_PAYMENT_Y_KASSA } from '../common/constants/payment.constant'
import { ApiError } from '../common/utils/log/exists-error.log'

import type { IPaymentPipeDto } from './pipe/payment.pipe'
import {
	isResponseErrorApi,
	isResponsePaymentApi,
	isResponsePaymentListApi,
} from './pipe/response.pipe'
import type {
	IResponseGetYooKassaApi,
	IResponseItemsYooKassaApi,
} from './types/api.interface'

export class PaymentApi {
	private paymentId = APP_PAYMENT_CONFIG.PAYMENT_ID
	private paymentSecretKey = APP_PAYMENT_CONFIG.PAYMENT_SECRET_KEY
	private credentials = Buffer.from(
		`${this.paymentId}:${this.paymentSecretKey}`
	).toString('base64')

	constructor() {}

	private async apiFetch<T>(
		url: string,
		method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
		idempotenceKey?: string,
		body?: T
	): Promise<ApiError | unknown> {
		if (!this.paymentId || !this.paymentSecretKey)
			return ApiError.InternalServer(
				'Config-error payment-id or payment-secret invalid'
			)

		try {
			const res = await fetch(
				url,
				idempotenceKey && body
					? {
							method,
							headers: {
								Authorization: `Basic ${this.credentials}`,
								'Idempotence-Key': idempotenceKey,
								'Content-Type': 'application/json',
							},
							body: JSON.stringify(body),
					  }
					: {
							method,
							headers: {
								Authorization: `Basic ${this.credentials}`,
							},
					  }
			)

			if (!res.ok) return ApiError.BadRequest('Bad-fetching to yoo-kassa api!')

			const data = await res.json()
			console.log(data)
			return data
		} catch (error) {
			return ApiError.InternalServer(
				error instanceof Error
					? error.message
					: 'Something was wrong from api-fetch payment-system'
			)
		}
	}

	public async createApiPay(
		dto: IPaymentPipeDto
	): Promise<IResponseItemsYooKassaApi | ApiError> {
		try {
			const idempotenceKey = uuid4()
			const resApi = await this.apiFetch(
				API_PAYMENT_Y_KASSA,
				'POST',
				idempotenceKey,
				dto
			)

			if (isResponseErrorApi(resApi)) return resApi

			if (!isResponsePaymentApi(resApi))
				return ApiError.BadRequest(
					'Error result from yoo-kassa api create-pay data is not valid'
				)

			return resApi
		} catch (error) {
			return ApiError.InternalServer(
				error instanceof Error
					? error.message
					: 'Something was wrong from api-fetch create-payment'
			)
		}
	}

	public async getAllApiPayInfo(
		limit: number | string,
		cursor: string | undefined
	): Promise<IResponseGetYooKassaApi | ApiError> {
		try {
			const resApi = await this.apiFetch(
				`${API_PAYMENT_Y_KASSA}?limit=${limit}${
					cursor ? `&cursor=${cursor}` : ''
				}`,
				'GET'
			)

			if (isResponseErrorApi(resApi)) return resApi

			if (!isResponsePaymentListApi(resApi))
				return ApiError.BadRequest(
					'Error result from yoo-kassa api get-all data is not valid'
				)

			return resApi
		} catch (error) {
			return ApiError.InternalServer(
				error instanceof Error
					? error.message
					: 'Something was wrong from api-fetch get-all payment'
			)
		}
	}

	public async getOneApiPayInfo(
		payId: string
	): Promise<IResponseItemsYooKassaApi | ApiError> {
		try {
			const resApi = await this.apiFetch(
				`${API_PAYMENT_Y_KASSA}/${payId}`,
				'GET'
			)

			if (isResponseErrorApi(resApi)) return resApi

			if (!isResponsePaymentApi(resApi))
				return ApiError.BadRequest(
					'Error result from yoo-kassa api get-info data is not valid'
				)

			return resApi
		} catch (error) {
			return ApiError.InternalServer(
				error instanceof Error
					? error.message
					: 'Something was wrong from api-fetch get-info about payment'
			)
		}
	}

	public async confirmApiPay(
		payId: string
	): Promise<IResponseItemsYooKassaApi | ApiError> {
		try {
			const idempotenceKey = uuid4()
			const resApi = await this.apiFetch(
				`${API_PAYMENT_Y_KASSA}/${payId}/capture`,
				'POST',
				idempotenceKey,
				{}
			)

			if (isResponseErrorApi(resApi)) return resApi

			if (!isResponsePaymentApi(resApi))
				return ApiError.BadRequest(
					'Error result from yoo-kassa api get-info data is not valid'
				)

			return resApi
		} catch (error) {
			return ApiError.InternalServer(
				error instanceof Error
					? error.message
					: 'Something was wrong from api-fetch confirm payment'
			)
		}
	}

	public async cancelApiPay(
		payId: string
	): Promise<IResponseItemsYooKassaApi | ApiError> {
		try {
			const idempotenceKey = uuid4()
			const resApi = await this.apiFetch(
				`${API_PAYMENT_Y_KASSA}/${payId}/cancel`,
				'POST',
				idempotenceKey,
				{}
			)

			if (isResponseErrorApi(resApi)) return resApi

			if (!isResponsePaymentApi(resApi))
				return ApiError.BadRequest(
					'Error result from yoo-kassa api get-info data is not valid'
				)

			return resApi
		} catch (error) {
			return ApiError.InternalServer(
				error instanceof Error
					? error.message
					: 'Something was wrong from api-fetch cancel payment'
			)
		}
	}
}
