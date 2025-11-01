import type { Pool } from 'pg'
import type { Logger } from 'winston'
import type { IUser } from '../app/db/types/user.types'
import { DB_TABLE_USERS } from '../common/constants/table-db.constant'
import type { RegistrationDto } from './dto/registration.dto'
import type { VerifyLinkDto } from './dto/verify.dto'

export class AuthModel {
	constructor(private pool: Pool, private logger: Logger) {}

	async getUserByEmail(email: string | undefined): Promise<IUser | null> {
		try {
			const query = `SELECT * FROM ${DB_TABLE_USERS} WHERE email = $1 LIMIT 1`
			const queryResult = await this.pool.query<IUser>(query, [email])

			return queryResult.rows[0] ?? null
		} catch (error) {
			this.logger.error(
				'Error searching for user by email:',
				error instanceof Error ? error.message : 'Internal server'
			)

			return null
		}
	}

	async getUserByPhone(phone: string | undefined): Promise<IUser | null> {
		try {
			const query = `SELECT * FROM ${DB_TABLE_USERS} WHERE phone = $1 LIMIT 1`
			const queryResult = await this.pool.query<IUser>(query, [phone])

			return queryResult.rows[0] ?? null
		} catch (error) {
			this.logger.error(
				'Error searching for user by phone:',
				error instanceof Error ? error.message : 'Internal server'
			)

			return null
		}
	}

	async getUserBydActivationLinkModel(
		dto: VerifyLinkDto
	): Promise<Pick<IUser, 'activation_link'> | null> {
		const query = `SELECT activation_link FROM ${DB_TABLE_USERS} WHERE activation_link = $1`

		const queryResult = await this.pool.query<Pick<IUser, 'activation_link'>>(
			query,
			[dto.activationLink]
		)

		return queryResult.rows[0] ?? null
	}

	async createUserModel(
		dto: RegistrationDto,
		activationLink: string
	): Promise<IUser | undefined> {
		const query = `
				INSERT INTO ${DB_TABLE_USERS} 
				(first_name, last_name, email, phone, password, avatar, activation_link)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				RETURNING id, first_name, last_name, email, phone, avatar, role, is_verify, activation_link
			`

		const queryResult = await this.pool.query<IUser>(query, [
			dto.firstName,
			dto.lastName,
			dto.email,
			dto.phone,
			dto.password,
			dto.avatar,
			activationLink,
		])

		return queryResult.rows[0]
	}

	async verifyModel(dto: VerifyLinkDto): Promise<boolean> {
		const query = `SELECT * FROM ${DB_TABLE_USERS} WHERE activation_link = $1`
		const queryUpdatedVerify =
			'UPDATE users SET is_verify = true WHERE id = $1 RETURNING is_verify'

		const queryResult = await this.pool.query<IUser>(query, [
			dto.activationLink,
		])

		const userData = queryResult.rows[0]

		if (!userData || !userData.id) return false

		const isUserVerify = await this.pool.query<Pick<IUser, 'is_verify'>>(
			queryUpdatedVerify,
			[userData.id]
		)

		return isUserVerify.rows[0]?.is_verify || false
	}

	async logoutModel() {}
}
