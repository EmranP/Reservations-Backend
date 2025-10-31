import helmet from 'helmet'
import type { Middleware } from '../types/middlewares/app.types-middleware'

export const helmetMiddleware: Middleware<unknown> = async (
	ctx,
	next
): Promise<void> => {
	helmet()

	await next()
}
