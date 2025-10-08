import { ROLES } from '../../../app/roles'

export interface ITokenPayload {
	id: number
	role: typeof ROLES
}

export interface IGenerateToken {
	accessToken: string
	refreshToken: string
}
