import type { IncomingMessage, ServerResponse } from 'node:http'

export interface IContext<T> {
	cookies?: Record<string, string>
	req: IncomingMessage
	res: ServerResponse
	body?: T | { error: string }
}

export type Middleware = <T>(
	ctx: IContext<T>,
	next: () => Promise<void>
) => Promise<void>
