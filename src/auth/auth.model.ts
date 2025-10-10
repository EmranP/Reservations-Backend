import type { Pool } from 'pg'
import type { IUser } from '../app/db/types/user.types'
import { DB_TABLE_USERS } from '../common/constants/table-db.constant'
import type { LoginDto } from './dto/login.dto'
import type { RegistrationDto } from './dto/registration.dto'
import type { VerifyLinkDto } from './dto/verify.dto'

export class AuthModel {
	constructor(private pool: Pool) {}

	async loginModel(dto: LoginDto): Promise<IUser | null> {
		const query = `SELECT * FROM ${DB_TABLE_USERS} WHERE email = $1 AND password = $2;`
		const queryResult = await this.pool.query<IUser>(query, [
			dto.email,
			dto.password,
		])

		return queryResult.rows[0] ?? null
	}

	async registrationModel(dto: RegistrationDto): Promise<IUser | undefined> {
		const query = `
				INSERT INTO ${DB_TABLE_USERS} 
				(first_name, last_name, email, phone, password, avatar)
				VALUES ($1, $2, $3, $4, $5, $6)
				RETURNING id, first_name, last_name, email, phone, avatar, role, is_verify
			`
		const queryResult = await this.pool.query<IUser>(query, [
			dto.firstName,
			dto.lastName,
			dto.email,
			dto.phone,
			dto.password,
			dto.avatar,
		])

		return queryResult.rows[0]
	}

	async getUserBydActivationLinkModel(
		dto: VerifyLinkDto
	): Promise<Pick<IUser, 'activation_link'> | null> {
		// Query DB
		const query = `SELECT activation_link FROM ${DB_TABLE_USERS} WHERE activation_link = $1`

		const queryResult = await this.pool.query<Pick<IUser, 'activation_link'>>(
			query,
			[dto.activationLink]
		)

		return queryResult.rows[0] ?? null
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
