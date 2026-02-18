import type { IncomingMessage } from 'http'
import {
	isRequestUserApp,
	isVerifyTokenError,
} from '../../common/utils/app/checkType.utils'
import { ApiError } from '../../common/utils/log/exists-error.log'
import { tokenService } from '../index.auth'
import type { IRequestUserApp } from '../types/token.type'

export const isAuth = async (
	req: IRequestUserApp | IncomingMessage
): Promise<undefined | ApiError> => {
	const authHeader = req.headers.authorization

	if (!authHeader) return ApiError.UnauthorizedError()

	const accessToken = authHeader.split(' ')[1]

	if (!accessToken) return ApiError.UnauthorizedError()

	const userData = await tokenService.verifyToken(accessToken)

	if (isVerifyTokenError(userData)) return ApiError.BadRequest(userData.message)

	if (isRequestUserApp(req)) {
		req.user = userData
	}
}
