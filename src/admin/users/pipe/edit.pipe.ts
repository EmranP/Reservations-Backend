import type { AdminUserEditDto } from '../dto/edit.dto'

export const isEditUserAdmin = (obj: unknown): obj is AdminUserEditDto => {
	const isCommonValid = typeof obj === 'object' && obj !== null

	if (!isCommonValid) return false

	const isValidFirstName =
		'firstName' in obj && typeof obj.firstName === 'string'
	const isValidLastName = 'lastName' in obj && typeof obj.lastName === 'string'
	const isValidPhone = 'phone' in obj && typeof obj.phone === 'string'
	const isValidEmail = 'email' in obj && typeof obj.email === 'string'
	const isValidPicture = 'picture' in obj && typeof obj.picture === 'string'
	const isValidRole = 'role' in obj && typeof obj.role === 'number'
	const isValidVerify = 'isVerify' in obj && typeof obj.isVerify === 'boolean'
	const isValidPassword = 'password' in obj && typeof obj.password === 'string'
	const isValidMethod = 'method' in obj && typeof obj.method === 'string'

	return (
		isValidFirstName ||
		isValidLastName ||
		isValidPhone ||
		isValidEmail ||
		isValidPicture ||
		isValidRole ||
		isValidVerify ||
		isValidPassword ||
		isValidMethod
	)
}
