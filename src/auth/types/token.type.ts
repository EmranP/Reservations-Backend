import { ROLES } from '../../app/roles'

export interface ITokenPayload {
	id: number
	role: typeof ROLES
}

export interface IGenerateToken {
	accessToken: string
	refreshToken: string
}

export interface IResponseTokens {
	id: string
	user_id: string
	refresh_token: string
	created_at: Date
}
