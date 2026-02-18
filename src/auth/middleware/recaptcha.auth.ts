import { APP_CONFIG } from '../../common/config/app.config'
import { googleRecaptchaVerify } from '../../common/constants/auth.constant'
import { ApiError } from '../../common/utils/log/exists-error.log'
import { isRecaptchaResponseDto } from '../dto/recaptcha.dto'

export const verifyRecaptcha = async (
	token: string | undefined
): Promise<void | ApiError> => {
	if (!APP_CONFIG.RE_CAPTCHA_SECRET_KEY)
		return ApiError.InternalServer('Error not set secret-key from app-config')

	if (!token)
		return ApiError.BadRequest('Bad-request: Recaptcha token is not empty!')

	const params = new URLSearchParams({
		secret: APP_CONFIG.RE_CAPTCHA_SECRET_KEY,
		response: token,
	})

	const res = await fetch(googleRecaptchaVerify, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: params.toString(),
	})

	const data = await res.json()

	if (!isRecaptchaResponseDto(data))
		return ApiError.BadRequest('Bad-request from recaptcha data')

	if (!data.success) return ApiError.BadRequest('reCAPTCHA failed')
}
