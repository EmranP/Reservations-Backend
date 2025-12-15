import bcrypt from 'bcrypt'
import type { Pool } from 'pg'
import type { Logger } from 'winston'
import type { IAccounts } from '../../../app/db/types/accounts.types'
import type { IToken } from '../../../app/db/types/tokens.types'
import type {
	IUser,
	TypeReturnUpdateOAuthUser,
} from '../../../app/db/types/user.types'
import {
	DB_TABLE_ACCOUNTS,
	DB_TABLE_TOKENS,
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
		(user_id, provider, types, access_token, refresh_token, expires_in, google_refresh_token_iv, google_refresh_token_tag) 
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
		ON CONFLICT (user_id) 
		DO UPDATE SET access_token = EXCLUDED.access_token, 
		refresh_token = EXCLUDED.refresh_token, 
		expires_in = EXCLUDED.expires_in,
		types =  EXCLUDED.types,
		google_refresh_token_iv = EXCLUDED.google_refresh_token_iv,
		google_refresh_token_tag = EXCLUDED.google_refresh_token_tag,
		provider = EXCLUDED.provider
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
			dto.googleRefreshIv,
			dto.googleRefreshTag,
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
		const query = `SELECT * FROM ${DB_TABLE_ACCOUNTS} WHERE user_id = $1`
		const queryResult = await this.pool.query<IAccounts>(query, [userId])

		if (!queryResult.rows[0]) return null

		return queryResult.rows[0]
	}

	async updateUserAccount(
		userId: string,
		dto: ICreateUserAccountDto
	): Promise<Pick<IAccounts, 'id'> | null> {
		const query = `
		UPDATE ${DB_TABLE_ACCOUNTS} SET 
		provider = COALESCE($1, provider), 
		types = COALESCE($2, types), 
		access_token = COALESCE($3, access_token), 
		expires_in = COALESCE($4, expires_in)
		WHERE user_id = $5 RETURNING id`

		const queryResult = await this.pool.query<Pick<IAccounts, 'id'>>(query, [
			dto.provider,
			dto.types,
			dto.accessToken,
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
	): Promise<TypeReturnUpdateOAuthUser | null> {
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
		RETURNING id, first_name, email, phone, picture, is_verify, created_at, updated_at, role`

		const queryResult = await this.pool.query<TypeReturnUpdateOAuthUser>(
			query,
			[
				dto.firstName,
				dto.email,
				dto.phone,
				dto.password,
				dto.picture,
				dto.isVerify,
				dto.authMethod,
				resetLink,
				userId,
			]
		)

		if (!queryResult.rows[0]) return null

		return queryResult.rows[0]
	}

	async updateTokens(
		id: string,
		access: string,
		refresh: string,
		expiresIn: Date,
		types: string
	): Promise<true | null> {
		const existToken = `SELECT refresh_token FROM ${DB_TABLE_TOKENS} WHERE user_id = $1`
		const existsTokenResult = await this.pool.query<
			Pick<IToken, 'refresh_token'>
		>(existToken, [id])

		for (const row of existsTokenResult.rows) {
			const isMatch = await bcrypt.compare(refresh, row.refresh_token)

			if (isMatch) {
				const query = `UPDATE ${DB_TABLE_ACCOUNTS} SET
				access_token = COALESCE($1, access_token),
				expires_in = COALESCE($2, expires_in),
				types = COALESCE($3, types)
				WHERE user_id = $4
				`
				const queryResult = await this.pool.query<
					Pick<IAccounts, 'access_token'>
				>(query, [access, expiresIn, types, id])

				if (queryResult.rowCount === 0) return null

				return true
			}
		}

		return null
	}

	async deleteUserAccount(userId: string): Promise<boolean | null> {
		const existUser = `SELECT id FROM ${DB_TABLE_USERS} WHERE id = $1`
		const existUserResult = await this.pool.query<Pick<IUser, 'id'>>(
			existUser,
			[userId]
		)

		if (!existUserResult.rows[0]) return null

		const query = `DELETE FROM ${DB_TABLE_ACCOUNTS} WHERE userId = $1`
		const queryResult = await this.pool.query(query, [
			existUserResult.rows[0].id,
		])

		if (queryResult.rowCount && queryResult.rowCount <= 0) return null

		return true
	}
}
