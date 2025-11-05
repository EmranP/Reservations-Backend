import bcrypt from 'bcrypt'
import type { Pool } from 'pg'
import { DB_TABLE_TOKENS } from '../../common/constants/table-db.constant'
import type { IResponseTokens } from '../types/token.type'

export class TokenModel {
	constructor(private pool: Pool) {}

	async create(
		userId: string,
		refreshToken: string
	): Promise<IResponseTokens | null> {
		const query = `
				INSERT INTO ${DB_TABLE_TOKENS} 
				(user_id, refresh_token) 
				VALUES ($1, $2) 
				ON CONFLICT (user_id)
				DO UPDATE SET refresh_token = EXCLUDED.refresh_token
				RETURNING *
			`

		const queryResult = await this.pool.query<IResponseTokens>(query, [
			userId,
			refreshToken,
		])

		return queryResult.rows[0] ?? null
	}

	async findOne(
		userId: string
	): Promise<Pick<IResponseTokens, 'id' | 'refresh_token'>[] | null> {
		const query = `SELECT id, refresh_token FROM ${DB_TABLE_TOKENS} WHERE user_id = $1`
		const queryResult = await this.pool.query<IResponseTokens>(query, [userId])

		return queryResult.rows ?? null
	}

	async delete(
		userId: string,
		refreshToken: string
	): Promise<Pick<IResponseTokens, 'id' | 'refresh_token'> | null> {
		const query = `SELECT id, refresh_token FROM ${DB_TABLE_TOKENS} WHERE user_id = $1`
		const queryResult = await this.pool.query<
			Pick<IResponseTokens, 'id' | 'refresh_token'>
		>(query, [userId])

		for (const row of queryResult.rows) {
			const isMatch = await bcrypt.compare(refreshToken, row.refresh_token)

			if (isMatch) {
				const queryRemove = `DELETE FROM ${DB_TABLE_TOKENS} WHERE user_id = $1`

				await this.pool.query(queryRemove, [userId])

				return { id: row.id, refresh_token: row.refresh_token }
			}
		}

		return null
	}
}
