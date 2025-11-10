import type { IncomingMessage } from 'http'
import type { JWTPayload } from 'jose'
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

export interface IUserJwtPayload extends JWTPayload {
	role: typeof ROLES | undefined
	type: string
}

export interface IRequestUserApp extends IncomingMessage {
	user: IUserJwtPayload | undefined
}
