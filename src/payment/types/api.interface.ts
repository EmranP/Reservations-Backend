export interface IResponsePaymentAmount {
	value: string
	currency: string
}

export interface IResponsePaymentConfirmation {
	type: string
	return_url: string
	confirmation_url: string
}

export interface IResponsePaymentMethodCardProduct {
	code: string
	name: string
}

export interface IResponsePaymentMethodCard {
	first6: string
	last4: string
	expiry_month: string
	expiry_year: string
	card_type: string
	card_product: IResponsePaymentMethodCardProduct
	issuer_country: string
	issuer_name: string
}

export interface IResponsePaymentMethod {
	type: string
	id: string
	saved: boolean
	card?: IResponsePaymentMethodCard
	title?: string
}

export interface IResponsePaymentRecipient {
	account_id: string
	gateway_id: string
}

export interface IResponseItemsYooKassaApi {
	id: string
	status: string
	paid: boolean
	amount: IResponsePaymentAmount
	confirmation: IResponsePaymentConfirmation
	created_at: Date
	description: string
	metadata: { orderId: string }
	payment_method: IResponsePaymentMethod
	recipient: IResponsePaymentRecipient
	refundable: boolean
	test: boolean
}

export interface IResponseGetYooKassaApi {
	type: string
	items: IResponseItemsYooKassaApi[]
	next_cursor?: string
}
