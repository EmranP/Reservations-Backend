import type { Pool } from 'pg'
import type { Logger } from 'winston'
import type { IUser } from '../app/db/types/user.types'
import { DB_TABLE_USERS } from '../common/constants/table-db.constant'
import type { ForgetDto } from './dto/forget.dto'
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
		activationLink: string,
		resetPassLink: string
	): Promise<IUser | undefined> {
		const query = `
				INSERT INTO ${DB_TABLE_USERS} 
				(first_name, last_name, email, phone, password, avatar, activation_link, reset_pass_link)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
			resetPassLink,
		])

		return queryResult.rows[0]
	}

	async verifyModel(
		dto: VerifyLinkDto
	): Promise<Pick<IUser, 'id' | 'is_verify' | 'created_at'> | false> {
		const query = `SELECT id FROM ${DB_TABLE_USERS} WHERE activation_link = $1`
		const queryUpdatedVerify = `UPDATE ${DB_TABLE_USERS} SET is_verify = true WHERE id = $1 RETURNING id, is_verify, created_at`

		const queryResult = await this.pool.query<
			Pick<IUser, 'id' | 'is_verify' | 'created_at'>
		>(query, [dto.activationLink])

		if (!queryResult.rows[0]) return false

		const userData = queryResult.rows[0]

		if (!userData || !userData.id) return false

		const isUserVerify = await this.pool.query<
			Pick<IUser, 'id' | 'is_verify' | 'created_at'>
		>(queryUpdatedVerify, [userData.id])

		return isUserVerify.rows[0] || false
	}

	async forgetVerifyModel(
		dto: Omit<ForgetDto, 'newPassword' | 'email'>
	): Promise<Pick<IUser, 'enable_reset_pass' | 'id'> | false> {
		const query = `SELECT id, enable_reset_pass FROM ${DB_TABLE_USERS} WHERE reset_pass_link = $1`
		const queryResetPass = `UPDATE ${DB_TABLE_USERS} SET enable_reset_pass = $1 WHERE id = $2 RETURNING id, enable_reset_pass`

		const queryResult = await this.pool.query<
			Pick<IUser, 'id' | 'enable_reset_pass'>
		>(query, [dto.resetLink])

		const user = queryResult.rows[0]

		if (!user || !user.id) return false

		const resetUserPass = await this.pool.query<
			Pick<IUser, 'id' | 'enable_reset_pass'>
		>(queryResetPass, [dto.isEnableResetPass, user.id])

		return resetUserPass.rows[0] || false
	}

	async updateResetLink(
		userId: string,
		newLink: string
	): Promise<Pick<IUser, 'id'> | false> {
		const query = `UPDATE ${DB_TABLE_USERS} SET reset_pass_link = $1 WHERE id = $2 RETURNING id`
		const queryResult = await this.pool.query<Pick<IUser, 'id'>>(query, [
			newLink,
			userId,
		])

		const user = queryResult.rows[0]

		if (!user || !user.id) return false

		return user ?? false
	}

	async updateEnableResetPass(
		enablePass: boolean,
		userId: string
	): Promise<Pick<IUser, 'id'> | false> {
		const query = `UPDATE ${DB_TABLE_USERS} SET enable_reset_pass = $1 WHERE id = $2 RETURNING id`
		const queryResult = await this.pool.query<Pick<IUser, 'id'>>(query, [
			enablePass,
			userId,
		])

		if (!queryResult.rows[0]) return false

		return queryResult.rows[0]
	}

	async setNewPasswordMode(
		dto: Pick<ForgetDto, 'email' | 'newPassword'>,
		isEnableReset: boolean,
		userId: string
	) {
		const query = `SELECT * FROM ${DB_TABLE_USERS} WHERE enable_reset_pass = $1 AND id = $2`
		const queryEditPass = `UPDATE ${DB_TABLE_USERS} SET password = $1 WHERE id = $2 RETURNING *`

		const queryResult = await this.pool.query<IUser>(query, [
			isEnableReset,
			userId,
		])

		const user = queryResult.rows[0]

		if (!user || !user.id)
			return {
				message: 'User is not founded',
				status: 404,
			}

		const queryEditPassResult = await this.pool.query<IUser>(queryEditPass, [
			dto.newPassword,
			user.id,
		])

		const newProfile = queryEditPassResult.rows[0]

		if (!newProfile)
			return {
				message: 'Error from set new pass',
				status: 500,
			}

		return {
			user: newProfile,
			oldPass: user.password,
		}
	}

	async resetUpdateUserPassword(
		userId: string,
		dto: Omit<ForgetDto, 'email' | 'resetLink'>
	): Promise<Pick<IUser, 'id'> | false> {
		const query = `UPDATE ${DB_TABLE_USERS} SET password = $1, enable_reset_pass = $2 WHERE id = $3 RETURNING id`

		const queryResult = await this.pool.query<Pick<IUser, 'id'>>(query, [
			dto.newPassword,
			dto.isEnableResetPass,
			userId,
		])

		if (!queryResult.rows[0]) return false

		return queryResult.rows[0]
	}
}
