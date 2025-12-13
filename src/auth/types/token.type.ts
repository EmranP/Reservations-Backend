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
	is_two_auth_code: number | null
	expires_token_at: Date | null
	expires_two_auth_code: Date | null
	expires_forget_pass: Date | null
	created_at: Date
	updated_at: Date
}

export interface IUserJwtPayload extends JWTPayload {
	role: typeof ROLES | undefined
	type: string
}

export interface IRequestUserApp extends IncomingMessage {
	user: IUserJwtPayload | undefined
}

export interface IUserGoogleJwtPayload extends JWTPayload {
	email: string
	email_verified: boolean
	at_hash: string
	name: string
	picture: string
	given_name: string
}
