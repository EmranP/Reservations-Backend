import type { IncomingMessage, ServerResponse } from 'node:http'

export interface IContext<T> {
	req: IncomingMessage
	res: ServerResponse
	body?: T | null
}

export type Middleware = <T>(
	ctx: IContext<T>,
	next: () => Promise<void>
) => Promise<void>
