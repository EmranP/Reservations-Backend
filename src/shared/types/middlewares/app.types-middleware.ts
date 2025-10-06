import type { IncomingMessage, ServerResponse } from 'node:http'
import type { TypeContextBody } from './body-parser.type'

export interface IContext {
	req: IncomingMessage
	res: ServerResponse
	cookies?: Record<string, string>
	body?: TypeContextBody
}

export type Middleware = (
	ctx: IContext,
	next: () => Promise<void>
) => Promise<void>
