import type {
	Middleware,
	TypeErrorContextBody,
} from '../types/middlewares/app.types-middleware'

export const json: Middleware<unknown> = async (ctx, next): Promise<void> => {
	const { req } = ctx
	const contentType = req.headers['content-type'] || ''

	if (
		req.method === 'POST' ||
		req.method === 'PUT' ||
		req.method === 'GET' ||
		req.method === 'DELETE'
	) {
		if (contentType.includes('application/json')) {
			const chunks: Uint8Array[] = []

			for await (const chunk of req) {
				chunks.push(chunk)
			}

			const raw = Buffer.concat(chunks).toString('utf-8')

			try {
				ctx.body = JSON.parse(raw)
			} catch (err) {
				const data: TypeErrorContextBody = { error: 'Invalid JSON' }
				ctx.res.statusCode = 400
				ctx.res.end(JSON.stringify(data))
				return
			}
		}
	}

	await next()
}
