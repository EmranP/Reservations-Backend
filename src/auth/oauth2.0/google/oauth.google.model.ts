import type { Pool } from 'pg'
import type { Logger } from 'winston'
import type { IAccounts } from '../../../app/db/types/accounts.types'
import {
	DB_TABLE_ACCOUNTS,
	DB_TABLE_USERS,
} from '../../../common/constants/table-db.constant'
import type {
	ICreateUserAccountDto,
	ICreateUserWithoutAccountDto,
} from '../../dto/oauth.dto'

export class OAuthGoogleModel {
	constructor(private pool: Pool, private logger: Logger) {}

	async createUserAccount(
		userId: string,
		dto: ICreateUserAccountDto
	): Promise<boolean> {
		const query = `INSERT INTO ${DB_TABLE_ACCOUNTS} (user_id, provider, types, access_token, refresh_token, expires_in) VALUES ($1, $2, $3, $4, $5, 6$) ON CONFLICT (user_id) DO UPDATE SET access_token = EXCLUDED.access_token, refresh_token = EXCLUDED.refresh_token, expires_in = EXCLUDED.expires_in`

		const queryResult = await this.pool.query(query, [
			userId,
			dto.provider,
			dto.types,
			dto.accessToken,
			dto.refreshToken,
			dto.expiresIn,
		])

		if (queryResult.rowCount && queryResult.rowCount <= 0) return false

		return true
	}

	async createUserWithoutAccount(
		dto: ICreateUserWithoutAccountDto,
		activationLink: string,
		resetLink: string,
		authMethod: string
	): Promise<boolean> {
		const query = `INSERT INTO ${DB_TABLE_USERS} (first_name, email, phone, password, picture, is_verify, method, activation_link, reset_pass_link) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

		const queryResult = await this.pool.query(query, [
			dto.firstName,
			dto.email,
			dto.phone,
			dto.password,
			dto.picture,
			dto.isVerify,
			authMethod,
			activationLink,
			resetLink,
		])

		if (queryResult.rowCount && queryResult.rowCount <= 0) return false

		return true
	}

	async findUserAccount(userId: string): Promise<IAccounts | null> {
		const query = `SELECT * FROM ${DB_TABLE_USERS} WHERE user_id = $1`

		const queryResult = await this.pool.query<IAccounts>(query, [userId])

		if (!queryResult.rows[0]) return null

		return queryResult.rows[0]
	}

	async updateUserAccount(
		userId: string,
		dto: ICreateUserAccountDto
	): Promise<IAccounts | null | false> {
		const query = `UPDATE ${DB_TABLE_ACCOUNTS} SET provider = $1, types = $2, access_token = $3, refresh_token = $4, expires_in = $5 WHERE user_id = $6 RETURNING *`

		const queryResult = await this.pool.query<IAccounts>(query, [
			dto.provider,
			dto.types,
			dto.accessToken,
			dto.refreshToken,
			dto.expiresIn,
			userId,
		])

		if (
			(queryResult.rowCount && queryResult.rowCount <= 0) ||
			!queryResult.rows[0]
		)
			return false

		return queryResult.rows[0]
	}

	async deleteUserAccount(userId: string): Promise<boolean> {
		const query = `DELETE FROM ${DB_TABLE_ACCOUNTS} WHERE userId = $1`

		const queryResult = await this.pool.query(query, [userId])

		if (queryResult.rowCount && queryResult.rowCount <= 0) return false

		return true
	}
}
