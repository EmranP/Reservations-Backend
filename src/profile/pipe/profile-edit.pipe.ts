import type { EditProfileDto } from '../dto/edit-profile.dto'

export const isEditProfileDto = (obj: unknown): obj is EditProfileDto => {
	const isCommonValidObj = typeof obj === 'object' && obj !== null

	if (!isCommonValidObj) return false

	const isValidFirstName =
		'firstName' in obj && typeof obj.firstName === 'string'

	const isValidLastName = 'lastName' in obj && typeof obj.lastName === 'string'

	const isValidPhone = 'phone' in obj && typeof obj.phone === 'string'

	console.log(isValidFirstName)
	console.log(isValidLastName)
	console.log(isValidPhone)

	return isValidFirstName || isValidLastName || isValidPhone
}
