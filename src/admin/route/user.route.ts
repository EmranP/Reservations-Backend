import type { IncomingMessage, ServerResponse } from 'http'
import { hasRole } from '../../auth/middleware/hasRole.auth'

import { ROLES } from '../../app/enums'
import {
	USER_DELETE_URL,
	USER_UPDATE_URL,
	USERS_GET_ALL_URL,
	USERS_GET_ONE_URL,
} from '../../common/constants/admin.constant'
import type { IAppQueryParams } from '../../common/types/app/app.type'
import { responseBadRequest } from '../../common/utils/app/errorResponse.utils'
import { ApiError } from '../../common/utils/log/exists-error.log'
import { adminUserController } from '../user/index.user'

export const userRouter = async (
	isAuth: ApiError | undefined,
	path: string,
	query: IAppQueryParams,
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>,
	body?: unknown,
	next?: () => Promise<void>
): Promise<void> => {
	const accessAdminRole = await hasRole([ROLES.ADMIN], req, res, next)
	const accessCustomerRole = await hasRole([ROLES.CUSTOMER], req, res, next)

	if (
		path === `${query.path}${query.searchParams}` ||
		(path === USERS_GET_ALL_URL && req.method === 'GET')
	) {
		if (isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (accessAdminRole) {
			await responseBadRequest(accessAdminRole, res, 403)

			return
		}

		await adminUserController.getAllUser(req, res, body)
	} else if (path === USERS_GET_ONE_URL && req.method === 'GET') {
		//! Add query params for by id
		await adminUserController.getByIdUser(req, res, body)
	} else if (path === USER_UPDATE_URL && req.method === 'PATCH') {
		await adminUserController.editUser(req, res, body)
	} else if (path === USER_DELETE_URL && req.method === 'DELETE') {
		await adminUserController.deleteUser(req, res, body)
	} else {
		const apiError = ApiError.BadRequest('Bad-request from user router')

		await responseBadRequest(apiError.message, res)
	}
}
