export class RegistrationDto {
	firstName: string | undefined
	lastName: string | undefined
	email: string | undefined
	avatar: string | undefined
	phone: string | undefined
	password: string | undefined
}

export const isAuthRegistrationDto = (obj: unknown): obj is RegistrationDto => {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'firstName' in obj &&
		'lastName' in obj &&
		'email' in obj &&
		'avatar' in obj &&
		'phone' in obj &&
		'password' in obj &&
		typeof obj.firstName === 'string' &&
		typeof obj.lastName === 'string' &&
		typeof obj.email === 'string' &&
		typeof obj.avatar === 'string' &&
		typeof obj.phone === 'string' &&
		typeof obj.password === 'string'
	)
}
