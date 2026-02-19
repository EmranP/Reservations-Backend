import { globalPrefixUrl } from './global.constant'

export const CREATE_REVIEWS = `${globalPrefixUrl}/reviews/add`
export const GET_ALL_REVIEWS = `${globalPrefixUrl}/reviews`
export const GET_ALL_MY_REVIEWS = `${globalPrefixUrl}/reviews/me`
export const GET_ONE_REVIEWS = `${globalPrefixUrl}/review`
export const EDIT_REVIEWS = `${globalPrefixUrl}/review/edit`
export const REMOVE_REVIEWS = `${globalPrefixUrl}/review/remove`

export const rootReviewsRouter = [CREATE_REVIEWS]
