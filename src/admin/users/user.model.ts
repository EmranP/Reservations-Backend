import type { Pool } from 'pg'
import type { Logger } from 'winston'
import type {
	IUser,
	TypeUserClientRes,
	TypeUserID,
} from '../../app/db/types/user.types'
import { DB_TABLE_USERS } from '../../common/constants/table-db.constant'
import type { IAppMessage } from '../../common/types/app/app.type'
import { responseErrorDB } from '../../common/utils/app/errorResponse.utils'
import type { AdminUserEditDto } from './dto/edit.dto'

export class UserModel {
	private getModelData = `id, first_name, 
			last_name, email, phone, picture, 
			role, is_verify, created_at, updated_at`

	constructor(private pool: Pool, private logger: Logger) {}

	async getAllUserModel(
		limit: number,
		offset: number
	): Promise<TypeUserClientRes[]> {
		const query = `SELECT ${this.getModelData} FROM ${DB_TABLE_USERS}
			ORDER BY created_at DESC
			LIMIT $1 OFFSET $2
		`

		const queryResult = await this.pool.query<TypeUserClientRes>(query, [
			limit,
			offset,
		])

		return queryResult.rows ?? []
	}

	async getUserByIdModel(userId: string): Promise<TypeUserClientRes | null> {
		try {
			const query = `
			SELECT ${this.getModelData} FROM ${DB_TABLE_USERS} 
			WHERE id = $1`
			const result = await this.pool.query<TypeUserClientRes>(query, [userId])

			if (!result.rows[0]) return null

			return result.rows[0]
		} catch (error) {
			const errorMessage = responseErrorDB(
				this.logger,
				error,
				'Error get one user:'
			)

			return errorMessage
		}
	}

	async editUserModel(
		userId: string,
		dto: AdminUserEditDto,
		imagePath: string | undefined
	): Promise<TypeUserID | null> {
		try {
			const query = `UPDATE ${DB_TABLE_USERS} SET
			first_name = COALESCE($1, first_name), 
			last_name = COALESCE($2, last_name), 
			email = COALESCE($3, email), 
			phone = COALESCE($4, phone), 
			picture = COALESCE($5, picture), 
			role = COALESCE($6, role), 
			is_verify = COALESCE($7, is_verify), 
			password = COALESCE($8, password),
			method = COALESCE($9, method)
			WHERE id = $10
			RETURNING id
			`

			const result = await this.pool.query<TypeUserID>(query, [
				dto.firstName,
				dto.lastName,
				dto.email,
				dto.phone,
				imagePath,
				dto.role,
				dto.isVerify,
				dto.password,
				dto.method,
				userId,
			])

			if (!result.rows[0]?.id) return null

			return result.rows[0]
		} catch (error) {
			this.logger.error(
				'Error update user',
				error instanceof Error ? error.message : 'Internal server'
			)

			return null
		}
	}

	async removeUserModel(userId: string): Promise<IAppMessage> {
		const existingUserQuery = `SELECT id FROM ${DB_TABLE_USERS} WHERE id = $1`

		const existingUserResult = await this.pool.query<Pick<IUser, 'id'>>(
			existingUserQuery,
			[userId]
		)

		const existingUserId = existingUserResult.rows[0]?.id

		if (!existingUserId)
			return {
				message: 'Error user not founded',
			}

		const query = `DELETE FROM ${DB_TABLE_USERS} WHERE id = $1`

		await this.pool.query(query, [existingUserId])

		return { message: `User has success deleting: ${existingUserId}` }
	}
}
