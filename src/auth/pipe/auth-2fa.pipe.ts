import type {
	EnableTwoFactoryChallenge,
	VerifyTwoFactoryAuthDto,
} from '../dto/2fa.dto'

export const isEnableTwoFactoryChallengeDto = (
	obj: unknown
): obj is EnableTwoFactoryChallenge => {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'isEnableTwoAuthCode' in obj &&
		typeof obj.isEnableTwoAuthCode === 'boolean'
	)
}

export const isAuthVerifyTwoFactory = (
	obj: unknown
): obj is VerifyTwoFactoryAuthDto => {
	const isCommonValidVerifyObj = typeof obj === 'object' && obj !== null

	const isCodeValidVerifyObj =
		isCommonValidVerifyObj && 'code' in obj && typeof obj.code === 'number'

	const isEmailValidVerifyObj =
		isCommonValidVerifyObj &&
		isCodeValidVerifyObj &&
		'email' in obj &&
		typeof obj.email === 'string'

	const isPhoneValidVerifyObj =
		isCommonValidVerifyObj &&
		isCodeValidVerifyObj &&
		'phone' in obj &&
		typeof obj.phone === 'string'

	return isPhoneValidVerifyObj || isEmailValidVerifyObj
}
