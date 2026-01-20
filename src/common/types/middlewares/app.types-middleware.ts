import type { IncomingMessage, ServerResponse } from 'node:http'

export type TypeErrorContextBody = {
	error: string
}

export interface IContextFiles {
	fileBufferData: Buffer<ArrayBufferLike> | undefined
}

export interface IContext<T> {
	req: IncomingMessage
	res: ServerResponse
	cookies?: Record<string, string>
	body?: T
	file?: IContextFiles
}

export type Middleware<T> = (
	ctx: IContext<T>,
	next: () => Promise<void>
) => Promise<void>
