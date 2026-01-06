export class RegistrationDto {
	firstName: string | undefined
	lastName: string | undefined
	email: string | undefined
	picture: string | undefined
	phone: string | undefined
	password: string | undefined
}

export const isAuthRegistrationDto = (obj: unknown): obj is RegistrationDto => {
	const isValidCommon = typeof obj === 'object' && obj !== null

	const isValidWithALlData =
		isValidCommon &&
		'firstName' in obj &&
		'lastName' in obj &&
		'email' in obj &&
		'picture' in obj &&
		'phone' in obj &&
		'password' in obj &&
		typeof obj.firstName === 'string' &&
		typeof obj.lastName === 'string' &&
		typeof obj.email === 'string' &&
		typeof obj.picture === 'string' &&
		typeof obj.phone === 'string' &&
		typeof obj.password === 'string'

	const isValidWithMain =
		isValidCommon &&
		'firstName' in obj &&
		'email' in obj &&
		'phone' in obj &&
		'password' in obj &&
		typeof obj.email === 'string' &&
		typeof obj.firstName === 'string' &&
		typeof obj.password === 'string' &&
		typeof obj.phone === 'string'

	return isValidWithALlData || isValidWithMain
}
