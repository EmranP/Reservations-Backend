import type { Middleware } from '../shared/types/middlewares/app.types-middleware'

export const cookieParser: Middleware = async (ctx, next): Promise<void> => {
	const cookieHeader = ctx.req.headers.cookie || ''
	const cookie: Record<string, string> = {}

	cookieHeader.split(';').forEach(pair => {
		const [key, val] = pair.trim().split('=')

		if (key && val) decodeURIComponent(pair)
	})

	ctx.cookies = cookie

	await next()
}
