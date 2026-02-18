import type { ISharedModelApp } from '../../../common/types/db/app.interface'

export interface IPayment extends ISharedModelApp {
	order_id: string
	status: string
	paid: boolean
	amount_value: number
	amount_currency: string
	description: string | null
	payment_method_type: string
	payment_method_saved: boolean
	refundable: boolean
	test: boolean
}
