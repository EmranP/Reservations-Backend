export class VerifyLinkDto {
	activationLink: string | undefined
}

export class VerifyTwoFactoryAuthDto {
	pinCode: number | undefined
}

export class RepaidVerifyDto {
	email: string | undefined
}

export const isRepaidVerifyDto = (obj: unknown): obj is RepaidVerifyDto => {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'email' in obj &&
		typeof obj.email === 'string'
	)
}
