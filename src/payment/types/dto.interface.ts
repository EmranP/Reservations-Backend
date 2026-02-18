import type { IResponseItemsYooKassaApi } from './api.interface'

export interface IPaymentDto
	extends Pick<IResponseItemsYooKassaApi, 'id' | 'status' | 'paid'> {
	orderId: string
	paid: boolean
	amountValue: number
	amountCurrency: string
	paymentMethodType: string
	paymentMethodSaved: boolean
	refundable: boolean
	test: boolean
	description: string | null
	createdAt: Date
	updatedAt: Date
}
