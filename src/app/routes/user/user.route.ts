import type { IncomingMessage, ServerResponse } from 'http'
import { hasRole } from '../../../auth/middleware/hasRole.auth'
import {
	USER_DELETE_URL,
	USER_GET_URL,
	USER_UPDATE_URL,
} from '../../../common/constants/api.constant'
import type { IAppQueryParams } from '../../../common/types/app/app.type'
import { responseBadRequest } from '../../../common/utils/app/errorResponse.utils'
import { ApiError } from '../../../common/utils/log/exists-error.log'
import { userController } from '../../../user/index.user'
import { ROLES } from '../../roles'

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
		(path === USER_GET_URL && req.method === 'GET')
	) {
		if (isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (accessAdminRole) {
			await responseBadRequest(accessAdminRole, res, 403)

			return
		}

		await userController.getAllUser(req, res, body)
	} else if (path === USER_GET_URL && req.method === 'GET') {
		//! Add query params for by id
		await userController.getByIdUser(req, res, body)
	} else if (path === USER_UPDATE_URL && req.method === 'PATCH') {
		await userController.editUser(req, res, body)
	} else if (path === USER_DELETE_URL && req.method === 'DELETE') {
		await userController.deleteUser(req, res, body)
	} else {
		const apiError = ApiError.BadRequest('Bad-request from user router')

		await responseBadRequest(apiError.message, res)
	}
}
