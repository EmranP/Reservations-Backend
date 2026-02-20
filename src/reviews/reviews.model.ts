import type { Pool, QueryResult } from 'pg'
import type { Logger } from 'winston'
import type { IReviews } from '../app/db/types/reviews.types'
import { DB_TABLE_REVIEWS } from '../common/constants/table-db.constant'
import type { TypeAppID } from '../common/types/db/app.interface'
import { responseErrorDB } from '../common/utils/app/errorResponse.utils'
import type { CreateReviewDto, EditReviewDto } from './types/dto.interface'

export class ReviewsModel {
	constructor(private pool: Pool, private logger: Logger) {}

	public async create(
		userId: string,
		dto: CreateReviewDto
	): Promise<TypeAppID | null> {
		try {
			const query = `
			INSERT INTO ${DB_TABLE_REVIEWS}
			(user_id, room_id, review, rating)
			VALUES ($1, $2, $3, $4)
			RETURNING id
			`
			const queryResult = await this.pool.query<TypeAppID>(query, [
				userId,
				dto.roomId,
				dto.review,
				dto.rating,
			])

			if (queryResult.rowCount === 0) return null

			return queryResult.rows[0] ?? null
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error create review'
			)

			return errorMessage
		}
	}

	public async getAll(
		roomId: string,
		limit: number,
		offset: number
	): Promise<IReviews[] | null> {
		try {
			const query = `
			SELECT * FROM ${DB_TABLE_REVIEWS} 
			WHERE room_id = $1 
			ORDER BY created_at DESC
			LIMIT $2 OFFSET $3`
			const queryResult = await this.pool.query<IReviews>(query, [
				roomId,
				limit,
				offset,
			])

			return queryResult.rows.length ? queryResult.rows : null
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error get-all review'
			)

			return errorMessage
		}
	}

	public async getOne(reviewId: string): Promise<IReviews | null> {
		try {
			const query = `SELECT * FROM ${DB_TABLE_REVIEWS} WHERE id = $1`
			const queryResult = await this.pool.query<IReviews>(query, [reviewId])

			return queryResult.rows[0] ?? null
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error get-one review'
			)

			return errorMessage
		}
	}

	public async getMe(
		roomId: string,
		userId: string,
		limit: number,
		offset: number
	): Promise<IReviews[] | null> {
		try {
			const query = `
				SELECT * FROM ${DB_TABLE_REVIEWS} 
				WHERE room_id = $1 AND user_id = $2
				ORDER BY created_at DESC
				LIMIT $3 OFFSET $4
			`
			const queryResult = await this.pool.query<IReviews>(query, [
				roomId,
				userId,
				limit,
				offset,
			])

			return queryResult.rows.length ? queryResult.rows : null
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error get-my review'
			)

			return errorMessage
		}
	}

	public async update(
		reviewId: string,
		userId: string,
		isAdmin: boolean,
		dto: EditReviewDto
	): Promise<TypeAppID | null> {
		try {
			let query: string
			let queryResult: QueryResult<TypeAppID>

			if (isAdmin) {
				query = `
					UPDATE ${DB_TABLE_REVIEWS} SET
					rating = COALESCE($1, rating),
					review = COALESCE($2, review)
					WHERE id = $3
					RETURNING id
				`
				queryResult = await this.pool.query<TypeAppID>(query, [
					dto.rating,
					dto.review,
					reviewId,
				])
			} else {
				query = `
					UPDATE ${DB_TABLE_REVIEWS} SET
					rating = COALESCE($1, rating),
					review = COALESCE($2, review)
					WHERE id = $3 AND user_id = $4
					RETURNING id
				`
				queryResult = await this.pool.query<TypeAppID>(query, [
					dto.rating,
					dto.review,
					reviewId,
					userId,
				])
			}

			if (queryResult.rowCount === 0) return null

			return queryResult.rows[0] ?? null
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error update review'
			)

			return errorMessage
		}
	}

	public async delete(
		reviewId: string,
		userId: string,
		isAdmin: boolean
	): Promise<TypeAppID | null> {
		try {
			let query: string
			let queryResult: QueryResult<TypeAppID>

			if (isAdmin) {
				query = `DELETE FROM ${DB_TABLE_REVIEWS} WHERE id = $1 RETURNING id`
				queryResult = await this.pool.query<TypeAppID>(query, [reviewId])
			} else {
				query = `DELETE FROM ${DB_TABLE_REVIEWS} WHERE id = $1 AND user_id = $2 RETURNING id`
				queryResult = await this.pool.query<TypeAppID>(query, [
					reviewId,
					userId,
				])
			}

			if (queryResult.rowCount === 0) return null

			return queryResult.rows[0] ?? null
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error delete review'
			)

			return errorMessage
		}
	}
}
