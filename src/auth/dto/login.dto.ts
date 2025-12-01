export class LoginDto {
	email: string | undefined
	password: string | undefined
	phone?: string | undefined
}

export const isAuthLoginDto = (obj: unknown): obj is LoginDto => {
	const isValidEmailObj =
		typeof obj === 'object' &&
		obj !== null &&
		'email' in obj &&
		'password' in obj &&
		typeof obj.email === 'string' &&
		typeof obj.password === 'string'

	const isValidPhoneObj =
		typeof obj === 'object' &&
		obj !== null &&
		'phone' in obj &&
		'password' in obj &&
		typeof obj.phone === 'string' &&
		typeof obj.password === 'string'

	return isValidEmailObj || isValidPhoneObj
}
