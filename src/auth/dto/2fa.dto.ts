import type { LoginDto } from './login.dto'

export class EnableTwoFactoryChallenge {
	isEnableTwoAuthCode: boolean | undefined
}

export class VerifyTwoFactoryAuthDto implements Omit<LoginDto, 'password'> {
	email: string | undefined
	phone: string | undefined
	code: number | undefined
}
