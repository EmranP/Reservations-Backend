import type { Logger } from 'winston'
import type { AdminModel } from '../admin/admin.model'
import { BaseConfig } from '../common/abstract/base-config.common'
import { DB_TABLE_REVIEWS } from '../common/constants/table-db.constant'
import { checkCacheRedisClient } from '../common/redis/utils/check-cache.util'
import { getRedisClientHashKey } from '../common/redis/utils/grud-redis.util'
import type {
	IAppMessage,
	IGetAllDataWithMeta,
} from '../common/types/app/app.type'
import { ApiError } from '../common/utils/log/exists-error.log'
import { ReviewsDto } from './dto/reviews.dto'
import type { ReviewsModel } from './reviews.model'
import type {
	CreateReviewDto,
	EditReviewDto,
	IReviewsDto,
} from './types/dto.interface'

export class ReviewsService extends BaseConfig {
	constructor(
		private model: ReviewsModel,
		private roomModel: AdminModel,
		private logger: Logger
	) {
		super()
	}

	public async addReview(
		userId: string | undefined,
		dto: CreateReviewDto
	): Promise<IAppMessage | ApiError> {
		if (!userId) return ApiError.NotFound('User-data not founded!')

		const newReview = await this.model.create(userId, dto)

		if (!newReview)
			return ApiError.InternalServer('Review is not success created')

		this.logger.info(`Review have success created: ID-${newReview.id}`)
		return {
			message: `Review have success created: ID-${newReview.id}`,
		}
	}

	public async findAllReview(
		roomId: string | undefined,
		limit: number,
		offset: number
	): Promise<IGetAllDataWithMeta<IReviewsDto> | ApiError> {
		if (!roomId) return ApiError.NotFound('Room-ID not founded!')

		const getOneRoomIdCache = await getRedisClientHashKey(
			this.keysRoomsIds,
			roomId
		)
		const getOneRoom = await checkCacheRedisClient(
			getOneRoomIdCache,
			() => this.roomModel.getRoomById(roomId),
			'Get room by id from cache!',
			'Get room by id from database!'
		)

		if (!getOneRoom) return ApiError.NotFound(`Room not founded: ID-${roomId}`)

		const totalReviewCount = await this.getModelCount(
			DB_TABLE_REVIEWS,
			this.logger
		)
		const allReview = await this.model.getAll(getOneRoom.id, limit, offset)

		if (!allReview?.length || !totalReviewCount)
			return ApiError.NotFound('Review not founded!')

		const allReviewDto = allReview.map(review =>
			new ReviewsDto(review).toPlain()
		)

		return {
			data: allReviewDto,
			meta: {
				limit,
				offset,
				total: totalReviewCount,
			},
		}
	}

	public async findAllMyReview(
		userId: string | undefined,
		roomId: string | undefined,
		limit: number,
		offset: number
	): Promise<IGetAllDataWithMeta<IReviewsDto> | ApiError> {
		if (!userId) return ApiError.NotFound('User-Id not founded!')

		if (!roomId) return ApiError.NotFound('Room-ID not founded!')

		const getOneRoomIdCache = await getRedisClientHashKey(
			this.keysRoomsIds,
			roomId
		)
		const getOneRoom = await checkCacheRedisClient(
			getOneRoomIdCache,
			() => this.roomModel.getRoomById(roomId),
			'Get room by id from cache!',
			'Get room by id from database!'
		)

		if (!getOneRoom) return ApiError.NotFound(`Room not founded: ID-${roomId}`)

		const allMyReview = await this.model.getMe(roomId, userId, limit, offset)
		const totalMyReview = await this.getModelCount(
			DB_TABLE_REVIEWS,
			this.logger,
			'user_id',
			userId
		)

		if (!allMyReview || !totalMyReview)
			return ApiError.NotFound('Your personal review not found!')

		const allMyReviewDto = allMyReview.map(review =>
			new ReviewsDto(review).toPlain()
		)

		return {
			data: allMyReviewDto,
			meta: {
				limit,
				offset,
				total: totalMyReview,
			},
		}
	}

	public async findOneReview(
		reviewId: string | undefined
	): Promise<IReviewsDto | ApiError> {
		if (!reviewId) return ApiError.NotFound('Review-ID not founded!')

		const review = await this.model.getOne(reviewId)

		if (!review) return ApiError.NotFound('Review not founded!')

		const reviewDto = new ReviewsDto(review)

		return reviewDto
	}

	public async editReview(
		reviewId: string | undefined,
		userId: string | undefined,
		role: number | undefined,
		dto: EditReviewDto
	): Promise<IAppMessage | ApiError> {
		if (!reviewId) return ApiError.NotFound('Review-ID not founded!')

		if (!userId || typeof role === 'undefined')
			return ApiError.NotFound('User-data not founded!')

		const isAdmin = this.isAdminHandler(role)
		const reviewUpdate = await this.model.update(reviewId, userId, isAdmin, dto)

		if (!reviewUpdate) return ApiError.InternalServer('Error from edit-review!')

		return { message: `Review have success update: ID-${reviewUpdate.id}` }
	}

	public async removeReview(
		reviewId: string | undefined,
		userId: string | undefined,
		role: number | undefined
	): Promise<IAppMessage | ApiError> {
		if (!reviewId) return ApiError.NotFound('Review-ID not founded!')

		if (!userId || typeof role === 'undefined')
			return ApiError.NotFound('User-data not founded!')

		const isAdmin = this.isAdminHandler(role)
		const reviewDelete = await this.model.delete(reviewId, userId, isAdmin)

		if (!reviewDelete)
			return ApiError.InternalServer('Error review is not success delete!')

		return {
			message: `Review have success delete: ID-${reviewDelete.id}`,
		}
	}
}
