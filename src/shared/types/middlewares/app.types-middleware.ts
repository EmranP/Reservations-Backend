import type { IncomingMessage, ServerResponse } from 'node:http'

export type TypeErrorContextBody = { error: 'Invalid JSON' }

export interface IContext<T> {
	req: IncomingMessage
	res: ServerResponse
	cookies?: Record<string, string>
	body?: T
}

export type Middleware<T> = (
	ctx: IContext<T>,
	next: () => Promise<void>
) => Promise<void>
