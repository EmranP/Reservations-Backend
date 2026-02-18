export class EditOrderDto {
	totalPrice: number | undefined
	residenceTime: Date | undefined
}

export const isEditOrderDto = (obj: unknown): obj is EditOrderDto => {
	const isCommonValid = typeof obj === 'object' && obj !== null

	if (!isCommonValid) return false

	const isValidTotalPrice =
		'totalPrice' in obj && typeof obj.totalPrice === 'number'
	const isValidResidenceTime =
		'residenceTime' in obj && typeof obj.residenceTime === 'string'

	return isValidTotalPrice || isValidResidenceTime
}
