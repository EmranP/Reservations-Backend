import type { Pool } from 'pg'
import type { Logger } from 'winston'
import type { IUser } from '../../app/db/types/user.types'
import { DB_TABLE_USERS } from '../../common/constants/table-db.constant'
import type { IAppMessage } from '../../common/types/app/app.type'

export class UserModel {
	constructor(private pool: Pool, private logger: Logger) {}

	async getAllUserModel(): Promise<
		Omit<IUser, 'password' | 'activation_link'>[]
	> {
		const query = `SELECT id, first_name, last_name, email, phone, avatar, role, is_verify FROM ${DB_TABLE_USERS}`

		const queryResult = await this.pool.query<
			Omit<IUser, 'password' | 'activation_link'>
		>(query)

		return queryResult.rows ?? []
	}

	async getUserByIdModel() {}

	async editUserModel() {}

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
