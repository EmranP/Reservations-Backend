import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger } from 'winston'
import type { IRequestUserApp } from '../auth/types/token.type'
import { BaseConfig } from '../common/abstract/base-config.common'
import type { IAppQueryParams } from '../common/types/app/app.type'
import {
	responseBadRequest,
	responseInternalServer,
} from '../common/utils/app/errorResponse.utils'
import type { ReviewsService } from './reviews.service'
import type { CreateReviewDto, EditReviewDto } from './types/dto.interface'

export class ReviewsController extends BaseConfig {
	constructor(private service: ReviewsService, private logger: Logger) {
		super()
	}

	public async create(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		body: CreateReviewDto
	): Promise<void> {
		try {
			const userId = req.user?.sub
			const newReviews = await this.service.addReview(userId, body)

			if ('status' in newReviews) {
				await responseBadRequest(newReviews.message, res, newReviews.status)

				return
			}

			res.writeHead(201, this.headData.contentData)
			res.end(JSON.stringify(newReviews))
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from add reviews!',
				this.logger
			)
		}
	}

	public async getAll(
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const roomId = query.queryParams?.roomId
			const limit = Number(query.queryParams?.limit) || 10
			const page = Number(query.queryParams?.page) || 1
			const offset = (page - 1) * limit
			const allReviews = await this.service.findAllReview(roomId, limit, offset)

			if ('message' in allReviews) {
				await responseBadRequest(allReviews.message, res, allReviews.status)

				return
			}

			res.writeHead(200, this.headData.contentData)
			res.end(JSON.stringify(allReviews))
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from get-all reviews!',
				this.logger
			)
		}
	}

	public async getAllMy(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const userId = req.user?.sub
			const roomId = query.queryParams?.roomId
			const limit = Number(query.queryParams?.limit) || 10
			const page = Number(query.queryParams?.page) || 1
			const offset = (page - 1) * limit
			const allReviews = await this.service.findAllMyReview(
				userId,
				roomId,
				limit,
				offset
			)

			if ('message' in allReviews) {
				await responseBadRequest(allReviews.message, res, allReviews.status)

				return
			}

			res.writeHead(200, this.headData.contentData)
			res.end(JSON.stringify(allReviews))
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from get-all my-reviews!',
				this.logger
			)
		}
	}

	public async getOne(
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const reviewId = query.queryParams?.reviewId
			const allReviews = await this.service.findOneReview(reviewId)

			if ('message' in allReviews) {
				await responseBadRequest(allReviews.message, res, allReviews.status)

				return
			}

			res.writeHead(200, this.headData.contentData)
			res.end(JSON.stringify(allReviews))
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from get-one reviews!',
				this.logger
			)
		}
	}

	public async update(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		body: EditReviewDto,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const reviewId = query.queryParams?.reviewId
			const userId = req.user?.sub
			const userRole = req.user?.role
			const updateReview = await this.service.editReview(
				reviewId,
				userId,
				userRole,
				body
			)

			if ('status' in updateReview) {
				await responseBadRequest(updateReview.message, res, updateReview.status)

				return
			}

			res.writeHead(200, this.headData.contentData)
			res.end(JSON.stringify(updateReview))
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from update reviews!',
				this.logger
			)
		}
	}

	public async delete(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		query: IAppQueryParams
	): Promise<void> {
		try {
			const reviewId = query.queryParams?.reviewId
			const userId = req.user?.sub
			const userRole = req.user?.role
			const removeReview = await this.service.removeReview(
				reviewId,
				userId,
				userRole
			)

			if ('status' in removeReview) {
				await responseBadRequest(removeReview.message, res, removeReview.status)

				return
			}

			res.writeHead(200, this.headData.contentData)
			res.end(JSON.stringify(removeReview))
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from delete reviews!',
				this.logger
			)
		}
	}
}
