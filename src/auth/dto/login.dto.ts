export class LoginDto {
	email: string | undefined
	password: string | undefined
	phone?: string | undefined
}

export const isAuthLoginDto = (obj: unknown): obj is LoginDto => {
	return (
		(typeof obj === 'object' &&
			obj !== null &&
			typeof (obj as LoginDto).email === 'string' &&
			typeof (obj as LoginDto).password === 'string') ||
		(typeof (obj as LoginDto).phone === 'string' &&
			typeof (obj as LoginDto).password === 'string')
	)
}
