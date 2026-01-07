import type { IncomingMessage, ServerResponse } from 'http'
import { validatePhoneReg } from '../auth/pipe/auth-valid.pipe'
import {
	PROFILE_EDIT,
	PROFILE_ME_GET,
	PROFILE_REMOVE_IMAGE,
	PROFILE_UPLOAD_IMAGE,
} from '../common/constants/profile.constant'
import type { IAppQueryParams } from '../common/types/app/app.type'
import { isRequestUserApp } from '../common/utils/app/checkType.utils'
import { responseBadRequest } from '../common/utils/app/errorResponse.utils'
import { ApiError } from '../common/utils/log/exists-error.log'
import { profileController } from './index.profile'
import { isEditProfileDto } from './pipe/profile-edit.pipe'

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

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}

		await profileController.findProfileMe(req, res)
	}
	// Profile EDIT ============
	else if (path === PROFILE_EDIT && req.method === 'PATCH') {
		if (isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}

		if (!isEditProfileDto(body)) {
			await responseBadRequest('Invalid data from body profile-edit.', res, 400)

			return
		}

		if (body.phone && !validatePhoneReg(body.phone)) {
			await responseBadRequest('Phone is not valid', res)

			return
		}

		await profileController.editProfileMe(req, res, body)
	}
	// Profile Upload Image ============
	else if (path === PROFILE_UPLOAD_IMAGE && req.method === 'POST') {
		if (isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}
	}
	// Profile Remove Image ============
	else if (path === PROFILE_REMOVE_IMAGE && req.method === 'DELETE') {
		if (isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}
	} else {
		const apiError = ApiError.BadRequest('Bad-request from user router')

		await responseBadRequest(apiError.message, res)
	}
}
