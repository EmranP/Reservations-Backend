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

	if (!isCommonValidVerifyObj) return false

	const isCodeValidVerifyObj = 'code' in obj && typeof obj.code === 'number'

	const isEmailValidVerifyObj =
		isCodeValidVerifyObj && 'email' in obj && typeof obj.email === 'string'

	const isPhoneValidVerifyObj =
		isCodeValidVerifyObj && 'phone' in obj && typeof obj.phone === 'string'

	return isPhoneValidVerifyObj || isEmailValidVerifyObj
}
