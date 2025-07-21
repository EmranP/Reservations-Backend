import type { Middleware } from '../shared/types/middlewares/app.types-middleware'

export const json: Middleware = async (ctx, next): Promise<void> => {
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
				console.log(chunk)
			}

			const raw = Buffer.concat(chunks).toString('utf-8')

			console.log(chunks)
			console.log(raw)
			try {
				ctx.body = JSON.parse(raw)
			} catch (err) {
				ctx.body = { error: 'Invalid JSON' }
				ctx.res.statusCode = 400
				ctx.res.end(JSON.stringify(ctx.body))
				return
			}
		}
	}

	await next()
}
