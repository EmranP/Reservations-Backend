export interface IRecaptchaDto {
	success: boolean
	challenge_ts: Date
	hostname: string
}

export class RecaptchaDto {
	recaptchaToken: string | undefined
}

export const isRecaptchaResponseDto = (obj: unknown): obj is IRecaptchaDto => {
	const isCommonValidObj = typeof obj === 'object' && obj !== null

	if (!isCommonValidObj) return false

	const isValid =
		'success' in obj &&
		typeof obj.success === 'boolean' &&
		'challenge_ts' in obj &&
		'hostname' in obj &&
		typeof obj.hostname === 'string'

	return isValid
}

export const isRecaptchaDto = (obj: unknown): obj is RecaptchaDto => {
	const isCommonValidObj = typeof obj === 'object' && obj !== null

	if (!isCommonValidObj) return false

	return (
		'recaptchaToken' in obj &&
		typeof obj.recaptchaToken === 'string' &&
		obj.recaptchaToken.length !== 0
	)
}
