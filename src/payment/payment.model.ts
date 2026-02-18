import type { Pool, QueryResult } from 'pg'
import type { Logger } from 'winston'
import type { IPayment } from '../app/db/types/payment.types'
import { DB_TABLE_PAYMENT } from '../common/constants/table-db.constant'
import type { TypeAppID } from '../common/types/db/app.interface'
import { responseErrorDB } from '../common/utils/app/errorResponse.utils'
import type { PaymentDto } from './dto/payment.dto'
import type { IResponseItemsYooKassaApi } from './types/api.interface'

export class PaymentModel {
	constructor(private pool: Pool, private logger: Logger) {}

	async createPay(
		orderId: string,
		userId: string,
		dto: IResponseItemsYooKassaApi
	): Promise<TypeAppID | null> {
		try {
			const query = `
				INSERT INTO ${DB_TABLE_PAYMENT}
				(id, order_id, user_id, 
				status, 
				paid, 
				amount_value, 
				amount_currency, 
				description, 
				payment_method_type, 
				payment_method_saved, 
				refundable, 
				test, 
				created_at)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
				RETURNING id
			`
			const queryResult = await this.pool.query<TypeAppID>(query, [
				dto.id,
				orderId,
				userId,
				dto.status,
				dto.paid,
				dto.amount.value,
				dto.amount.currency,
				dto.description,
				dto.payment_method.type,
				dto.payment_method.saved,
				dto.refundable,
				dto.test,
				dto.created_at,
			])

			if (!queryResult.rows[0]) return null

			return queryResult.rows[0]
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error create payment:'
			)

			return errorMessage
		}
	}

	async getAllPay(
		userId: string,
		isAdmin: boolean,
		limit: number,
		offset: number
	): Promise<IPayment[] | null> {
		try {
			let query: string
			let queryResult: QueryResult<IPayment> | null

			if (isAdmin) {
				query = `
				SELECT * FROM ${DB_TABLE_PAYMENT} 
				ORDER BY created_at DESC 
				LIMIT $1 OFFSET $2`
				queryResult = await this.pool.query<IPayment>(query, [limit, offset])
			} else {
				query = `
				SELECT * FROM ${DB_TABLE_PAYMENT}
				WHERE user_id = $1
				ORDER BY created_at DESC
				LIMIT $2 OFFSET $3
				`
				queryResult = await this.pool.query<IPayment>(query, [
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
				'Error get-all payment:'
			)

			return errorMessage
		}
	}

	async getOnePay(
		payId: string,
		userId: string,
		isAdmin: boolean
	): Promise<IPayment | null> {
		try {
			let query: string
			let queryResult: QueryResult<IPayment> | null

			if (isAdmin) {
				query = `
					SELECT * FROM ${DB_TABLE_PAYMENT}
					WHERE id = $1
				`
				queryResult = await this.pool.query<IPayment>(query, [payId])
			} else {
				query = `
					SELECT * FROM ${DB_TABLE_PAYMENT} 
					WHERE id = $1 AND user_id = $2
				`
				queryResult = await this.pool.query<IPayment>(query, [payId, userId])
			}

			return queryResult.rows[0] ?? null
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error get-one payment:'
			)

			return errorMessage
		}
	}

	async getPayBydId(payId: string): Promise<IPayment | null> {
		try {
			const query = `SELECT * FROM ${DB_TABLE_PAYMENT} WHERE id = $1`
			const queryResult = await this.pool.query<IPayment>(query, [payId])

			return queryResult.rows[0] ?? null
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error get-by ID payment:'
			)

			return errorMessage
		}
	}

	async editPay(payId: string, dto: PaymentDto): Promise<TypeAppID | null> {
		try {
			const query = `
				UPDATE ${DB_TABLE_PAYMENT} SET
				status = COALESCE($1, status),
				paid = COALESCE($2, paid),
				amount_value = COALESCE($3, amount_value),
				amount_currency = COALESCE($4, amount_currency),
				description = COALESCE($5, description),
				payment_method_type = COALESCE($6, payment_method_type),
				payment_method_saved = COALESCE($7, payment_method_saved),
				refundable = COALESCE($8, refundable),
				test = COALEsCE($9, test)
				WHERE id = $10
				RETURNING id
			`
			const queryResult = await this.pool.query<TypeAppID>(query, [
				dto.status,
				dto.paid,
				dto.amountValue,
				dto.amountCurrency,
				dto.description,
				dto.paymentMethodType,
				dto.paymentMethodSaved,
				dto.refundable,
				dto.test,
				payId,
			])

			if (queryResult.rowCount === 0) return null

			return queryResult.rows[0] ?? null
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error edit payment:'
			)

			return errorMessage
		}
	}

	async deletePay(payId: string): Promise<TypeAppID | null> {
		try {
			const query = `
				DELETE FROM ${DB_TABLE_PAYMENT} 
				WHERE id = $1
				RETURNING id
			`
			const queryResult = await this.pool.query<TypeAppID>(query, [payId])

			if (queryResult.rowCount === 0) return null

			return queryResult.rows[0] ?? null
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error delete payment:'
			)

			return errorMessage
		}
	}
}
