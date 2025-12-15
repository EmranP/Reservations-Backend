import type { RepaidVerifyDto } from './verify.dto'

export class ForgetDto implements RepaidVerifyDto {
	resetLink: string | undefined
	isEnableResetPass: boolean | undefined
	newPassword: string | undefined
	email: string | undefined
}

export const isConfirmNewPassDto = (
	obj: unknown
): obj is Pick<ForgetDto, 'newPassword' | 'email'> => {
	const isNewPass =
		typeof obj === 'object' &&
		obj !== null &&
		'newPassword' in obj &&
		typeof obj.newPassword === 'string'

	const isEmail =
		typeof obj === 'object' &&
		obj !== null &&
		'email' in obj &&
		typeof obj.email === 'string'

	return isNewPass && isEmail
}
