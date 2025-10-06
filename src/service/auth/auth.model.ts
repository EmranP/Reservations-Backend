import { pool } from '../../app/check-db.app'
import type { IUser } from '../../db/types/user.types'
import { DB_TABLE_USERS } from '../../shared/constants/table-db.constant'
import type { LoginDto, RegistrationDto, VerifyLinkDto } from './auth.dto'

// Login
export const authLoginModel = async (
	dtoLogin: LoginDto
): Promise<IUser | null> => {
	const query = `SELECT * FROM ${DB_TABLE_USERS} WHERE email = $1 AND password = $2;`
	const queryResult = await pool.query<IUser>(query, [
		dtoLogin.email,
		dtoLogin.password,
	])

	return queryResult.rows[0] ?? null
}

// Registration
export const authRegistrationModel = async (
	dtoReg: RegistrationDto
): Promise<IUser | undefined> => {
	const query = `
		INSERT INTO ${DB_TABLE_USERS} 
		(first_name, last_name, email, phone, password, avatar)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, first_name, last_name, email, phone, avatar, role, is_verify
	`
	const queryResult = await pool.query<IUser>(query, [
		dtoReg.firstName,
		dtoReg.lastName,
		dtoReg.email,
		dtoReg.phone,
		dtoReg.password,
		dtoReg.avatar,
	])

	return queryResult.rows[0]
}

// Get Activation Link
export const authGetUserByActivationLink = async (
	activationLink: string | null
): Promise<Pick<IUser, 'activation_link'> | null> => {
	// Query DB
	const query = `SELECT activation_link FROM ${DB_TABLE_USERS} WHERE activation_link = $1`

	const queryResult = await pool.query<Pick<IUser, 'activation_link'>>(query, [
		activationLink,
	])

	return queryResult.rows[0] ?? null
}

// Updated Verify
export const authVerifyModel = async (
	dtoVerifyLink: VerifyLinkDto
): Promise<boolean> => {
	const query = `SELECT * FROM ${DB_TABLE_USERS} WHERE activation_link = $1`
	const queryUpdatedVerify =
		'UPDATE users SET is_verify = true WHERE id = $1 RETURNING is_verify'

	const queryResult = await pool.query<IUser>(query, [
		dtoVerifyLink.activationLink,
	])

	const userData = queryResult.rows[0]

	if (!userData || !userData.id) return false

	const isUserVerify = await pool.query<Pick<IUser, 'is_verify'>>(
		queryUpdatedVerify,
		[userData.id]
	)

	return isUserVerify.rows[0]?.is_verify || false
}

// Logout
export const authLogoutModel = async () => {}
