export class LoginDto {
	email: string | undefined
	password: string | undefined
}

export class RegistrationDto {
	firstName: string | undefined
	lastName: string | undefined
	email: string | undefined
	avatar: string | undefined
	phone: string | undefined
	password: string | undefined
}

export class VerifyLinkDto {
	activationLink: string | undefined
}

export class TwoFactoryAuthDto {
	pinCode: number | undefined
}
