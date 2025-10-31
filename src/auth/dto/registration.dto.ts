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
		typeof (obj as RegistrationDto).firstName === 'string' &&
		typeof (obj as RegistrationDto).lastName === 'string' &&
		typeof (obj as RegistrationDto).email === 'string' &&
		typeof (obj as RegistrationDto).avatar === 'string' &&
		typeof (obj as RegistrationDto).phone === 'string' &&
		typeof (obj as RegistrationDto).password === 'string'
	)
}
