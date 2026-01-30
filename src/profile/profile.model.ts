import type { Pool } from 'pg'
import type { Logger } from 'winston'
import { DB_TABLE_USERS } from '../common/constants/table-db.constant'
import type { EditProfileDto } from './dto/edit-profile.dto'
import type { IUser } from '../app/db/types/user.types'

export class ProfileModel {
	constructor(private pool: Pool, private logger: Logger) {}

	async getProfileMe(userId: string): Promise<IUser | null> {
		try {
			const query = `SELECT * FROM ${DB_TABLE_USERS} WHERE id = $1`

			const queryResult = await this.pool.query<IUser>(query, [userId])

			return queryResult.rows[0] ?? null
		} catch (error) {
			this.logger.error(
				'Error get profile:',
				error instanceof Error ? error.message : 'Internal server'
			)

			return null
		}
	}

	async updateProfile(
		userId: string,
		dto: EditProfileDto
	): Promise<IUser | null> {
		try {
			const query = `
				UPDATE ${DB_TABLE_USERS} SET
				first_name = COALESCE($1, first_name),
				last_name = COALESCE($2, last_name),
				phone = COALESCE($3, phone)
				WHERE id = $4
				RETURNING *
			`
			const queryResult = await this.pool.query<IUser>(query, [
				dto.firstName,
				dto.lastName,
				dto.phone,
				userId,
			])

			if (queryResult.rowCount === 0) return null

			return queryResult.rows[0] ?? null
		} catch (error) {
			this.logger.error(
				'Error update profile-edit:',
				error instanceof Error ? error.message : 'Internal server'
			)

			return null
		}
	}

	async updateProfileImage(
		userId: string,
		profileImagePath: string | null,
		expireImageUrl: Date | null
	): Promise<IUser | null> {
		try {
			const query = `UPDATE ${DB_TABLE_USERS} SET 
				picture = $1,
				expire_picture_url = $2
				WHERE id = $3
				RETURNING *;
			`

			const queryResult = await this.pool.query<IUser>(query, [
				profileImagePath,
				expireImageUrl,
				userId,
			])

			if (queryResult.rowCount === 0) return null

			return queryResult.rows[0] ?? null
		} catch (error) {
			this.logger.error(
				'Error update profile-edit:',
				error instanceof Error ? error.message : 'Internal server'
			)

			return null
		}
	}
}
