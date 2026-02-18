import type { ApiError } from '../../common/utils/log/exists-error.log'
import type {
	IResponseGetYooKassaApi,
	IResponseItemsYooKassaApi,
} from '../types/api.interface'

export const isResponsePaymentApi = (
	obj: unknown
): obj is IResponseItemsYooKassaApi => {
	const isCommonValid = typeof obj === 'object' && obj !== null

	if (!isCommonValid) return false

	const isValidReq =
		'id' in obj &&
		typeof obj.id === 'string' &&
		'status' in obj &&
		typeof obj.status === 'string'

	return isValidReq
}

export const isResponsePaymentListApi = (
	obj: unknown
): obj is IResponseGetYooKassaApi => {
	const isCommonValid = typeof obj === 'object' && obj !== null

	if (!isCommonValid) return false

	const isValidReq = 'type' in obj && 'items' in obj

	return isValidReq
}

export const isResponseErrorApi = (obj: unknown): obj is ApiError => {
	const isCommonValid = typeof obj === 'object' && obj !== null

	if (!isCommonValid) return false

	const isValidApiError =
		'message' in obj &&
		typeof obj.message === 'string' &&
		'status' in obj &&
		typeof obj.status === 'number'

	return isValidApiError
}
