import type { IncomingMessage } from 'http'
import type { JWTPayload } from 'jose'
import type { IRequestUserApp } from '../../../auth/types/token.type'
import type { IErrorResponseApp } from '../../types/db/app.interface'

export const isVerifyTokenError = (
	data: JWTPayload | Pick<IErrorResponseApp, 'message'>
): data is Pick<IErrorResponseApp, 'message'> =>
	!!data && typeof data.message === 'string'

export const isRequestUserApp = (
	req: IncomingMessage | IRequestUserApp
): req is IRequestUserApp =>
	!!req && typeof req === 'object' && 'headers' in req
