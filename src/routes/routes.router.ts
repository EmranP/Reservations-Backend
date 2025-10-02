import { URL } from 'url'
import { rootAuthRouter } from '../shared/constants/api.constant'
import type { Middleware } from '../shared/types/middlewares/app.types-middleware'
import { responseNotFoundApi } from '../utils/app/errorResponse.utils'
import { authRouter } from './auth/auth.router'

export const routerApp: Middleware = async (ctx, next): Promise<void> => {
	const { req, res } = ctx

	if (!req.url) return

	const parserURL = new URL(req.url, `http://${req.headers.host}`)
	const path = `api${parserURL.pathname}`

	if (!rootAuthRouter.includes(path)) {
		await responseNotFoundApi('Not founded auth api', res)
	}

	await authRouter(path, req, res)

	await next()
}
