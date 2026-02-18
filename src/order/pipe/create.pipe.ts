export class CreateOrderDto {
	roomId: string | undefined
	totalPrice: number | undefined
	residenceTime: string | undefined
}

export const isCreateOrderDto = (obj: unknown): obj is CreateOrderDto => {
	const isCommonValid = typeof obj === 'object' && obj !== null

	if (!isCommonValid) return false

	const isValid =
		'roomId' in obj &&
		typeof obj.roomId === 'string' &&
		'totalPrice' in obj &&
		typeof obj.totalPrice === 'number' &&
		'residenceTime' in obj &&
		typeof obj.residenceTime === 'string'

	return isValid
}
