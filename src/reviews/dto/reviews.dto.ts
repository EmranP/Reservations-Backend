import type { IReviews } from '../../app/db/types/reviews.types'
import type { IReviewsDto } from '../types/dto.interface'

export class ReviewsDto implements IReviewsDto {
	id
	roomId
	review
	rating
	createdAt
	updatedAt

	constructor(data: IReviews) {
		this.id = data.id
		this.roomId = data.room_id
		this.review = data.review
		this.rating = data.rating
		this.createdAt = data.created_at
		this.updatedAt = data.updated_at
	}

	toPlain(): IReviewsDto {
		return {
			id: this.id,
			roomId: this.roomId,
			review: this.review,
			rating: this.rating,
			createdAt: this.createdAt,
			updatedAt: this.updatedAt,
		}
	}
}
