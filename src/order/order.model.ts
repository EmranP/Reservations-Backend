import type { Pool, QueryResult } from 'pg'
import type { Logger } from 'winston'
import type { IOrders } from '../app/db/types/orders.types'
import { DB_TABLE_ORDERS } from '../common/constants/table-db.constant'
import type { TypeAppID } from '../common/types/db/app.interface'
import { responseErrorDB } from '../common/utils/app/errorResponse.utils'
import type { CreateOrderDto } from './pipe/create.pipe'
import type { EditOrderDto } from './pipe/edit.pipe'

export class OrderModel {
	constructor(private pool: Pool, private logger: Logger) {}

	public async createOrder(
		userId: string,
		dto: CreateOrderDto
	): Promise<TypeAppID | null> {
		try {
			const query = `
				INSERT INTO ${DB_TABLE_ORDERS} 
				(user_id, room_id, total_price, residence_time)
				VALUES ($1, $2, $3, $4)
				RETURNING id
			`
			const queryResult = await this.pool.query<TypeAppID>(query, [
				userId,
				dto.roomId,
				dto.totalPrice,
				dto.residenceTime,
			])

			if (!queryResult.rows[0]) return null

			return queryResult.rows[0]
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error create order:'
			)

			return errorMessage
		}
	}

	public async getAllOrders(
		userId: string,
		isAdmin: boolean,
		limit: number,
		offset: number
	): Promise<IOrders[] | null> {
		try {
			let query: string | undefined
			let queryResult: QueryResult<IOrders> | undefined

			if (isAdmin) {
				query = `
					SELECT * FROM ${DB_TABLE_ORDERS} 
					ORDER BY created_at DESC 
					LIMIT $1 OFFSET $2`
				queryResult = await this.pool.query<IOrders>(query, [limit, offset])
			} else {
				query = `
					SELECT * FROM ${DB_TABLE_ORDERS} 
					WHERE user_id = $1 
					ORDER BY created_at DESC 
					LIMIT $2 OFFSET $3
				`
				queryResult = await this.pool.query<IOrders>(query, [
					userId,
					limit,
					offset,
				])
			}

			if (queryResult.rowCount === 0) return null

			return queryResult.rows ?? null
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error get-all orders:'
			)

			return errorMessage
		}
	}

	public async getByIdOrder(
		orderId: string,
		userId: string,
		isAdmin: boolean
	): Promise<IOrders | null> {
		try {
			let query: string | null
			let queryResult: QueryResult<IOrders>

			if (isAdmin) {
				query = `SELECT * FROM ${DB_TABLE_ORDERS} WHERE id = $1`
				queryResult = await this.pool.query<IOrders>(query, [orderId])
			} else {
				query = `
					SELECT * FROM ${DB_TABLE_ORDERS} 
					WHERE id = $1 AND user_id = $2
				`
				queryResult = await this.pool.query<IOrders>(query, [orderId, userId])
			}

			if (queryResult.rowCount === 0) return null

			return queryResult.rows[0] ?? null
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				`Error get-one order: ID-${orderId}`
			)

			return errorMessage
		}
	}

	public async updateOrder(
		orderId: string,
		userId: string,
		isAdmin: boolean,
		dto: EditOrderDto
	) {
		try {
			let query: string | null
			let queryResult: QueryResult<IOrders>

			if (isAdmin) {
				query = `
					UPDATE ${DB_TABLE_ORDERS} SET
					total_price = COALESCE($1, total_price),
					residence_time = COALESCE($2, residence_time)
					WHERE id = $3
					RETURNING *
				`
				queryResult = await this.pool.query<IOrders>(query, [
					dto.totalPrice,
					dto.residenceTime,
					orderId,
				])
			} else {
				query = `
					UPDATE ${DB_TABLE_ORDERS} SET
					total_price = COALESCE($1, total_price),
					residence_time = COALESCE($2, residence_time)
					WHERE id = $3 AND user_id = $4
					RETURNING *
				`
				queryResult = await this.pool.query<IOrders>(query, [
					dto.totalPrice,
					dto.residenceTime,
					orderId,
					userId,
				])
			}

			if (queryResult.rowCount === 0) return null

			return queryResult.rows[0] ?? null
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				`Error update order: ID-${orderId}`
			)

			return errorMessage
		}
	}

	public async deleteOrder(
		orderId: string,
		userId: string,
		isAdmin: boolean
	): Promise<TypeAppID | null> {
		try {
			let query: string | undefined
			let queryResult: QueryResult<TypeAppID>

			if (isAdmin) {
				query = `DELETE FROM ${DB_TABLE_ORDERS} WHERE id = $1 RETURNING id`
				queryResult = await this.pool.query<TypeAppID>(query, [orderId])
			} else {
				query = `
					DELETE FROM ${DB_TABLE_ORDERS} 
					WHERE id = $1 AND user_id = $2
					RETURNING id
				`
				queryResult = await this.pool.query<TypeAppID>(query, [orderId, userId])
			}

			if (queryResult.rowCount === 0) return null

			return queryResult.rows[0] ?? null
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				`Error delete orders: ID-${orderId}`
			)

			return errorMessage
		}
	}
}
