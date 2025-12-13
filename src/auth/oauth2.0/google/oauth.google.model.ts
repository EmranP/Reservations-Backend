import type { Pool } from 'pg'
import type { Logger } from 'winston'
import type { IAccounts } from '../../../app/db/types/accounts.types'
import type { IUser } from '../../../app/db/types/user.types'
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
	): Promise<
		Pick<IAccounts, 'access_token' | 'refresh_token' | 'expires_in'> | false
	> {
		const query = `
		INSERT INTO ${DB_TABLE_ACCOUNTS} 
		(user_id, provider, types, access_token, refresh_token, expires_in) 
		VALUES ($1, $2, $3, $4, $5, $6) 
		ON CONFLICT (user_id) 
		DO UPDATE SET access_token = EXCLUDED.access_token, 
		refresh_token = EXCLUDED.refresh_token, 
		expires_in = EXCLUDED.expires_in 
		RETURNING access_token, refresh_token, expires_in`

		const queryResult = await this.pool.query<
			Pick<IAccounts, 'access_token' | 'refresh_token' | 'expires_in'>
		>(query, [
			userId,
			dto.provider,
			dto.types,
			dto.accessToken,
			dto.refreshToken,
			dto.expiresIn,
		])

		if (
			(queryResult.rowCount && queryResult.rowCount <= 0) ||
			!queryResult.rows[0]
		)
			return false

		return queryResult.rows[0]
	}

	async createUserWithoutAccount(
		dto: ICreateUserWithoutAccountDto,
		resetLink: string,
		authMethod: string
	): Promise<IUser | null> {
		const query = `INSERT INTO ${DB_TABLE_USERS} (first_name, email, phone, password, picture, is_verify, method, reset_pass_link) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`

		const queryResult = await this.pool.query<IUser>(query, [
			dto.firstName,
			dto.email,
			dto.phone,
			dto.password,
			dto.picture,
			dto.isVerify,
			authMethod,
			resetLink,
		])

		if (queryResult.rowCount === 0 || !queryResult.rows[0]) return null

		return queryResult.rows[0]
	}

	async findUserAccount(userId: string): Promise<IAccounts | null> {
		const query = `SELECT * FROM ${DB_TABLE_USERS} WHERE id = $1`

		const queryResult = await this.pool.query<IAccounts>(query, [userId])

		if (!queryResult.rows[0]) return null

		return queryResult.rows[0]
	}

	async updateUserAccount(
		userId: string,
		dto: ICreateUserAccountDto
	): Promise<IAccounts | null> {
		const query = `
		UPDATE ${DB_TABLE_ACCOUNTS} SET 
		provider = COALESCE($1, provider), 
		types = COALESCE($2, types), 
		access_token = COALESCE($3, access_token), 
		refresh_token = COALESCE($4, refresh_token), 
		expires_in = COALESCE($5, expires_in) 
		WHERE user_id = $6 RETURNING *`

		const queryResult = await this.pool.query<IAccounts>(query, [
			dto.provider,
			dto.types,
			dto.accessToken,
			dto.refreshToken,
			dto.expiresIn,
			userId,
		])

		if (queryResult.rowCount === 0 || !queryResult.rows[0]) return null

		return queryResult.rows[0]
	}

	async updateUser(
		userId: string,
		dto: ICreateUserWithoutAccountDto,
		resetLink: string
	): Promise<IUser | null> {
		const query = `
		UPDATE ${DB_TABLE_USERS} SET 
		first_name = COALESCE($1, first_name), 
		email = COALESCE($2, email), 
		phone = COALESCE($3, phone), 
		password = COALESCE($4, password), 
		picture = COALESCE($5, picture), 
		is_verify = COALESCE($6, is_verify), 
		method = COALESCE($7, method), 
		reset_pass_link = COALESCE($8, reset_pass_link) 
		WHERE id = $9 
		RETURNING *`

		const queryResult = await this.pool.query<IUser>(query, [
			dto.firstName,
			dto.email,
			dto.phone,
			dto.password,
			dto.picture,
			dto.isVerify,
			dto.authMethod,
			resetLink,
			userId,
		])

		if (!queryResult.rows[0]) return null

		return queryResult.rows[0]
	}

	async deleteUserAccount(userId: string): Promise<boolean> {
		const query = `DELETE FROM ${DB_TABLE_ACCOUNTS} WHERE userId = $1`

		const queryResult = await this.pool.query(query, [userId])

		if (queryResult.rowCount && queryResult.rowCount <= 0) return false

		return true
	}
}
