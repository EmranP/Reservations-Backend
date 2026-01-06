import type { Pool } from 'pg'
import type { Logger } from 'winston'
import type { IUser } from '../../app/db/types/user.types'
import {
	DB_TABLE_TOKENS,
	DB_TABLE_USERS,
} from '../../common/constants/table-db.constant'
import type { IResponseTokens } from '../types/token.type'

export class AuthTwoFactoryChallengeModel {
	constructor(private pool: Pool, private logger: Logger) {}

	async enableTwoFactory(
		userId: string,
		isEnableTwoFA: boolean | undefined
	): Promise<Pick<IUser, 'id' | 'enable_two_factory_challenge'> | null> {
		const query = `UPDATE ${DB_TABLE_USERS} SET enable_two_factory_challenge = $1 WHERE id = $2 RETURNING id, enable_two_factory_challenge`
		const queryResult = await this.pool.query<
			Pick<IUser, 'id' | 'enable_two_factory_challenge'>
		>(query, [isEnableTwoFA, userId])

		if (!queryResult.rows[0]) return null

		return queryResult.rows[0]
	}

	async updateTwoFactoryAuthCode(
		code: number | null | undefined,
		expireCode: Date | null,
		userId: string
	): Promise<boolean> {
		const query = `UPDATE ${DB_TABLE_TOKENS} SET is_two_auth_code = $1, expires_two_auth_code = $2 WHERE user_id = $3`
		const queryResult = await this.pool.query(query, [code, expireCode, userId])

		if (queryResult.rowCount && queryResult.rowCount <= 0) return false

		return true
	}

	async findOneCode(
		userId: string
	): Promise<Pick<
		IResponseTokens,
		'is_two_auth_code' | 'expires_two_auth_code'
	> | null> {
		const query = `SELECT is_two_auth_code, expires_two_auth_code FROM ${DB_TABLE_TOKENS} WHERE user_id = $1`
		const queryResult = await this.pool.query<
			Pick<IResponseTokens, 'is_two_auth_code' | 'expires_two_auth_code'>
		>(query, [userId])

		if (!queryResult.rows[0]) return null

		return queryResult.rows[0]
	}
}
