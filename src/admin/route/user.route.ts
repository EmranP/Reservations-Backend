import type { IncomingMessage, ServerResponse } from 'http'
import { hasRole } from '../../auth/middleware/hasRole.auth'

import { ROLES } from '../../app/enums'
import {
	USER_DELETE_URL,
	USER_UPDATE_URL,
	USERS_GET_ALL_URL,
	USERS_GET_ONE_URL,
} from '../../common/constants/admin.constant'
import { isUploadDto } from '../../common/pipe/upload.pipe'
import type { IAppQueryParams } from '../../common/types/app/app.type'
import type { IContextFiles } from '../../common/types/middlewares/app.types-middleware'
import { isRequestUserApp } from '../../common/utils/app/checkType.utils'
import { responseBadRequest } from '../../common/utils/app/errorResponse.utils'
import { ApiError } from '../../common/utils/log/exists-error.log'
import { adminUserController } from '../users/index.user'
import { isEditUserAdmin } from '../users/pipe/edit.pipe'

export const userRouter = async (
	isAuth: ApiError | undefined,
	path: string,
	query: IAppQueryParams,
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>,
	body: unknown,
	file: IContextFiles | undefined,
	next: () => Promise<void>
): Promise<void> => {
	if (
		path === `${USERS_GET_ALL_URL}${query.searchParams}` &&
		req.method === 'GET'
	) {
		if (isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data not founded!', res)

			return
		}

		const accessAdminRole = await hasRole([ROLES.ADMIN], req, res, next)

		if (accessAdminRole) {
			await responseBadRequest(accessAdminRole, res, 403)

			return
		}

		await adminUserController.getAllUser(res, query)
	} else if (
		path === `${USERS_GET_ONE_URL}${query.searchParams}` &&
		req.method === 'GET'
	) {
		if (isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data not founded!', res)

			return
		}

		const accessAdminRole = await hasRole([ROLES.ADMIN], req, res, next)

		if (accessAdminRole) {
			await responseBadRequest(accessAdminRole, res, 403)

			return
		}

		await adminUserController.getByIdUser(res, query)
	} else if (
		path === `${USER_UPDATE_URL}${query.searchParams}` &&
		req.method === 'PATCH'
	) {
		if (isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data not founded!', res)

			return
		}

		const accessAdminRole = await hasRole([ROLES.ADMIN], req, res, next)

		if (accessAdminRole) {
			await responseBadRequest(accessAdminRole, res, 403)

			return
		}

		if (!isEditUserAdmin(body)) {
			await responseBadRequest('Invalid-data body to edit admin-user', res)

			return
		}

		if (file && file.fileBufferData && !isUploadDto(file)) {
			await responseBadRequest('User file is not founded!', res, 404)

			return
		}

		await adminUserController.editUser(res, query, body, file)
	} else if (
		path === `${USER_DELETE_URL}${query.searchParams}` &&
		req.method === 'DELETE'
	) {
		if (isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data not founded!', res)

			return
		}

		const accessAdminRole = await hasRole([ROLES.ADMIN], req, res, next)

		if (accessAdminRole) {
			await responseBadRequest(accessAdminRole, res, 403)

			return
		}

		await adminUserController.deleteUser(res, query)
	} else {
		await responseBadRequest('Bad-request from user router', res)
	}
}
