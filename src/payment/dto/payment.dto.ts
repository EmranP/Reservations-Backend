import type { IPayment } from '../../app/db/types/payment.types'
import type { IPaymentDto } from '../types/dto.interface'

export class PaymentDto implements IPaymentDto {
	id: string
	orderId: string
	paid: boolean
	amountValue: number
	amountCurrency: string
	paymentMethodType: string
	paymentMethodSaved: boolean
	refundable: boolean
	test: boolean
	status: string
	description: string | null
	createdAt: Date
	updatedAt: Date

	constructor(data: IPayment) {
		this.id = data.id
		this.orderId = data.order_id
		this.paid = data.paid
		this.amountValue = data.amount_value
		this.amountCurrency = data.amount_currency
		this.paymentMethodType = data.payment_method_type
		this.paymentMethodSaved = data.payment_method_saved
		this.refundable = data.refundable
		this.test = data.test
		this.status = data.status
		this.description = data.description
		this.createdAt = data.created_at
		this.updatedAt = data.updated_at
	}

	public toPlain(): IPaymentDto {
		return {
			id: this.id,
			orderId: this.orderId,
			status: this.status,
			paid: this.paid,
			amountValue: this.amountValue,
			amountCurrency: this.amountCurrency,
			paymentMethodType: this.paymentMethodType,
			paymentMethodSaved: this.paymentMethodSaved,
			refundable: this.refundable,
			test: this.test,
			description: this.description,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		}
	}
}
