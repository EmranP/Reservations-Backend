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
): Promise<Omit<IUser, 'created_at' | 'updated_at'> | null> => {
	const query = `SELECT id, first_name, last_name, email, phone, role, avatar, activation_link, is_verify FROM ${DB_TABLE_USERS} WHERE activation_link = $1`
	const queryResult = await pool.query<
		Omit<IUser, 'created_at' | 'updated_at'>
	>(query, [activationLink])

	return queryResult.rows[0] ?? null
}

// Updated Verify
export const authVerifyModel = async (dtoVerifyLink: VerifyLinkDto) => {
	const query = `SELECT * FROM ${DB_TABLE_USERS} WHERE activation_link`
}

// Logout
export const authLogoutModel = async () => {}
