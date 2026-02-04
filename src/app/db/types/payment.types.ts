import type { ISharedModelApp } from '../../../common/types/db/app.interface'

export interface IPayment extends ISharedModelApp {
	order_id: string
	type: string
	event: string
	status: string
	paid: boolean
	amount_value: number
	amount_currency: string
	description: string | null
	payment_method_type: string
	payment_method_saved: boolean
	refundable: boolean
	test: boolean
	income_amount_value: number
	income_amount_currency: string
	expires_at: Date | null
}
