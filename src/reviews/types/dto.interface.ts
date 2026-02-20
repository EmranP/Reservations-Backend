import type { IAppSharedDto } from '../../common/types/app/app.type'

export interface CreateReviewDto {
	roomId: string
	review: string
	rating: number
}

export interface EditReviewDto {
	review: string | undefined
	rating: number | undefined
}

export interface IReviewsDto extends IAppSharedDto {
	roomId: string
	review: string | null
	rating: number
}
