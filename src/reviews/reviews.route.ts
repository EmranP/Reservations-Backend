import type { IncomingMessage, ServerResponse } from 'http'
import {
	CREATE_REVIEWS,
	EDIT_REVIEWS,
	GET_ALL_MY_REVIEWS,
	GET_ALL_REVIEWS,
	GET_ONE_REVIEWS,
	REMOVE_REVIEWS,
} from '../common/constants/reviews.constant'
import type { IAppQueryParams } from '../common/types/app/app.type'
import { isRequestUserApp } from '../common/utils/app/checkType.utils'
import { responseBadRequest } from '../common/utils/app/errorResponse.utils'
import type { ApiError } from '../common/utils/log/exists-error.log'
import { reviewsController } from './index.reviews'
import { isCreateReviewDto, isEditReviewDto } from './pipe/create.pipe'

export const reviewsRouter = async (
	isAuth: ApiError | undefined,
	path: string,
	query: IAppQueryParams,
	req: IncomingMessage,
	res: ServerResponse<IncomingMessage>,
	body: unknown
): Promise<void> => {
	if (path === CREATE_REVIEWS && req.method === 'POST') {
		if (typeof isAuth !== 'undefined' && 'message' in isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}

		if (!isCreateReviewDto(body)) {
			await responseBadRequest('Invalid body from create-review', res, 404)

			return
		}

		await reviewsController.create(req, res, body)
	} else if (
		path === `${GET_ALL_REVIEWS}${query.searchParams}` &&
		req.method === 'GET'
	) {
		await reviewsController.getAll(res, query)
	} else if (
		path === `${GET_ALL_MY_REVIEWS}${query.searchParams}` &&
		req.method === 'GET'
	) {
		if (typeof isAuth !== 'undefined' && 'message' in isAuth) {
			await responseBadRequest(isAuth.message, res, isAuth.status)

			return
		}

		if (!isRequestUserApp(req)) {
			await responseBadRequest('User data is not founded!', res, 404)

			return
		}

		await reviewsController.getAllMy(req, res, query)
	} else if (
		path === `${GET_ONE_REVIEWS}${query.searchParams}` &&
		req.method === 'GET'
	) {
		await reviewsController.getOne(res, query)
	} else if (
		path === `${EDIT_REVIEWS}${query.searchParams}` &&
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

		if (!isEditReviewDto(body)) {
			await responseBadRequest('Invalid body from edit-review', res, 400)

			return
		}

		await reviewsController.update(req, res, body, query)
	} else if (
		path === `${REMOVE_REVIEWS}${query.searchParams}` &&
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

		await reviewsController.delete(req, res, query)
	} else {
		await responseBadRequest('Bad-request from reviews router', res)
	}
}
