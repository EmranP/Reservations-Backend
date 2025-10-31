import type { Middleware } from '../types/middlewares/app.types-middleware'

export const cors: Middleware<unknown> = async (ctx, next): Promise<void> => {
	const { req, res } = ctx
	const clientUrl = process.env.CLIENT_URL

	res.setHeader('Access-Control-Allow-Origin', clientUrl ?? '*')
	res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

	if (req.method === 'OPTIONS') {
		res.statusCode = 204
		res.end()
		return
	}

	await next()
}
