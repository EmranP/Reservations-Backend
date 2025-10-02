import { ROLES } from '../../../app/roles'

export interface ITokenPayload {
	userId: string
	role: typeof ROLES.ADMIN | typeof ROLES.CUSTOMER
}

export interface IGenerateToken {
	accessToken: string
	refreshToken: string
}
