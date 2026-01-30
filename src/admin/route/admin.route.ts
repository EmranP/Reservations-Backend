import type { IncomingMessage, ServerResponse } from 'http'
import { ROLES } from '../../app/enums'
import { hasRole } from '../../auth/middleware/hasRole.auth'
import {
	ROOMS_CREATE_URL,
	ROOMS_DELETE_IMAGE_URL,
	ROOMS_EDIT_URL,
	ROOMS_GET_ALL_URL,
	ROOMS_GET_ONE_URL,
	ROOMS_REMOVE_URL,
} from '../../common/constants/admin.constant'
import { isUploadDto } from '../../common/pipe/upload.pipe'
import type { IAppQueryParams } from '../../common/types/app/app.type'
import type { IContextFiles } from '../../common/types/middlewares/app.types-middleware'
import { isRequestUserApp } from '../../common/utils/app/checkType.utils'
import { responseBadRequest } from '../../common/utils/app/errorResponse.utils'
import { ApiError } from '../../common/utils/log/exists-error.log'
import { adminController } from '../index.admin'
import { isCreateRoomDto, isEditRoomDto } from '../pipe/room.pipe'

export const adminRoomRouter = async (
	isAuth: ApiError | undefined,
	path: string,
	query: IAppQueryParams,
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>,
	body?: unknown,
	file?: IContextFiles | undefined
): Promise<void> => {
	// POST Rooms
	if (path === ROOMS_CREATE_URL && req.method === 'POST') {
		if (typeof isAuth !== 'undefined' && 'message' in isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}
		const accessAdminRole = await hasRole([ROLES.ADMIN], req, res)

		if (accessAdminRole) {
			await responseBadRequest(accessAdminRole, res, 403)

			return
		}

		if (!isCreateRoomDto(body)) {
			await responseBadRequest('Invalid data from body create-room', res)

			return
		}

		if (!isUploadDto(file)) {
			await responseBadRequest('User file is not founded!', res, 404)

			return
		}

		await adminController.createRoom(res, body, file)
	}
	// GET
	else if (
		path === `${ROOMS_GET_ALL_URL}${query.searchParams}` &&
		req.method === 'GET'
	) {
		await adminController.getAllRoom(res, query)
	} else if (
		path === `${ROOMS_GET_ONE_URL}${query.searchParams}` &&
		req.method === 'GET'
	) {
		await adminController.getOneRoom(res, query)
	} else if (
		path === `${ROOMS_EDIT_URL}${query.searchParams}` &&
		req.method === 'PATCH'
	) {
		if (typeof isAuth !== 'undefined' && 'message' in isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}

		const accessAdminRole = await hasRole([ROLES.ADMIN], req, res)

		if (accessAdminRole) {
			await responseBadRequest(accessAdminRole, res, 403)

			return
		}

		if (!isEditRoomDto(body)) {
			await responseBadRequest('Invalid data from body edit-room', res)

			return
		}

		if (file && !isUploadDto(file)) {
			await responseBadRequest('Invalid file from edit-room!', res)

			return
		}

		await adminController.editRoom(res, query, body, file)
	} else if (
		path === `${ROOMS_DELETE_IMAGE_URL}${query.searchParams}` &&
		req.method === 'POST'
	) {
		if (typeof isAuth !== 'undefined' && 'message' in isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}

		const accessAdminRole = await hasRole([ROLES.ADMIN], req, res)

		if (accessAdminRole) {
			await responseBadRequest(accessAdminRole, res, 403)

			return
		}

		await adminController.removeImageRoom(res, query)
	} else if (
		path === `${ROOMS_REMOVE_URL}${query.searchParams}` &&
		req.method === 'DELETE'
	) {
		if (typeof isAuth !== 'undefined' && 'message' in isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}

		const accessAdminRole = await hasRole([ROLES.ADMIN], req, res)

		if (accessAdminRole) {
			await responseBadRequest(accessAdminRole, res, 403)

			return
		}

		await adminController.deleteRoom(res, query)
	} else {
		const apiError = ApiError.BadRequest('Bad-request from room router')

		await responseBadRequest(apiError.message, res)
	}
}
