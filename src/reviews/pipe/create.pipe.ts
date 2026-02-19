import type { CreateReviewDto, EditReviewDto } from '../types/dto.interface'

export const isCreateReviewDto = (obj: unknown): obj is CreateReviewDto => {
	const isCommonValid = typeof obj === 'object' && obj !== null

	if (!isCommonValid) return false

	const isRoomIdValid = 'roomId' in obj && typeof obj.roomId === 'string'

	const isRatingValid =
		isRoomIdValid &&
		'rating' in obj &&
		typeof obj.rating === 'number' &&
		obj.rating >= 1 &&
		obj.rating <= 5

	const isReviewValid =
		isRoomIdValid &&
		isRatingValid &&
		'review' in obj &&
		typeof obj.review === 'string'

	return isReviewValid || isRatingValid
}

export const isEditReviewDto = (obj: unknown): obj is EditReviewDto => {
	const isCommonValid = typeof obj === 'object' && obj !== null

	if (!isCommonValid) return false

	const isRatingValid =
		'rating' in obj &&
		typeof obj.rating === 'number' &&
		obj.rating >= 1 &&
		obj.rating <= 5

	const isReviewValid =
		'review' in obj && typeof obj.review === 'string' && !obj.review.length

	return isRatingValid || isReviewValid
}
