import type {
	IResponseItemsYooKassaApi,
	IResponsePaymentAmount,
	IResponsePaymentConfirmation,
} from '../types/api.interface'

export interface IPaymentPipeDto
	extends Pick<IResponseItemsYooKassaApi, 'description'> {
	amount: IResponsePaymentAmount
	payment_method_data: {
		type: string
	}
	confirmation: Omit<IResponsePaymentConfirmation, 'confirmation_url'>
	metadata?: {
		orderId: string | undefined
	}
}

export const isCreatePaymentDto = (obj: unknown): obj is IPaymentPipeDto => {
	const isCommonValid = typeof obj === 'object' && obj !== null

	if (!isCommonValid) return false

	const isValid =
		'amount' in obj &&
		typeof obj.amount === 'object' &&
		obj.amount !== null &&
		'value' in obj.amount &&
		typeof obj.amount.value === 'string' &&
		'currency' in obj.amount &&
		typeof obj.amount.currency === 'string' &&
		'payment_method_data' in obj &&
		typeof obj.payment_method_data === 'object' &&
		obj.payment_method_data !== null &&
		'type' in obj.payment_method_data &&
		typeof obj.payment_method_data.type === 'string' &&
		'confirmation' in obj &&
		typeof obj.confirmation === 'object' &&
		obj.confirmation !== null &&
		'type' in obj.confirmation &&
		typeof obj.confirmation.type === 'string' &&
		'return_url' in obj.confirmation &&
		typeof obj.confirmation.return_url === 'string' &&
		'metadata' in obj &&
		typeof obj.metadata === 'object'

	return isValid
}

export const isEditPaymentDto = (
	obj: unknown
): obj is Omit<IPaymentPipeDto, 'metadata'> => {
	const isCommonValid = typeof obj === 'object' && obj !== null

	if (!isCommonValid) return false

	const isValidAmount =
		'amount' in obj &&
		typeof obj.amount === 'object' &&
		obj.amount !== null &&
		'value' in obj.amount &&
		typeof obj.amount.value === 'string' &&
		'currency' in obj.amount &&
		typeof obj.amount.currency === 'string'

	const isValidStatus = 'status' in obj && typeof obj.status === 'string'
	const isValidPaid = 'paid' in obj && typeof obj.paid === 'boolean'
	const isValidPaymentMethod =
		'payment_method_data' in obj &&
		typeof obj.payment_method_data === 'object' &&
		obj.payment_method_data !== null &&
		'type' in obj.payment_method_data &&
		typeof obj.payment_method_data.type === 'string' &&
		'saved' in obj.payment_method_data &&
		typeof obj.payment_method_data.saved === 'boolean'
	const isValidRefundable =
		'refundable' in obj && typeof obj.refundable === 'boolean'
	const isValidTest = 'test' in obj && typeof obj.test === 'boolean'

	return (
		isValidAmount ||
		isValidStatus ||
		isValidPaid ||
		isValidPaymentMethod ||
		isValidRefundable ||
		isValidTest
	)
}
