import type { IncomingMessage, ServerResponse } from 'http'
import {
	PROFILE_EDIT,
	PROFILE_ME_GET,
	PROFILE_REMOVE_IMAGE,
	PROFILE_UPLOAD_IMAGE,
} from '../../../common/constants/profile.constant'
import type { IAppQueryParams } from '../../../common/types/app/app.type'
import { responseBadRequest } from '../../../common/utils/app/errorResponse.utils'
import { ApiError } from '../../../common/utils/log/exists-error.log'

export const profileRouter = async (
	isAuth: ApiError | undefined,
	path: string,
	query: IAppQueryParams,
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>,
	body?: unknown,
	next?: () => Promise<void>
): Promise<void> => {
	// Profile GET ============
	if (path === PROFILE_ME_GET && req.method === 'GET') {
		if (isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}
	}
	// Profile EDIT ============
	else if (path === PROFILE_EDIT && req.method === 'PATCH') {
		if (isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}
	}
	// Profile Upload Image ============
	else if (path === PROFILE_UPLOAD_IMAGE && req.method === 'POST') {
		if (isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}
	}
	// Profile Remove Image ============
	else if (path === PROFILE_REMOVE_IMAGE && req.method === 'DELETE') {
		if (isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}
	} else {
		const apiError = ApiError.BadRequest('Bad-request from user router')

		await responseBadRequest(apiError.message, res)
	}
}
