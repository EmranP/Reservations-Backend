import { URL } from 'url'
import { rootAuthRouter } from '../../common/constants/api.constant'
import type { Middleware } from '../../common/types/middlewares/app.types-middleware'
import { responseNotFoundApi } from '../../common/utils/app/errorResponse.utils'
import { authRouter } from './auth/auth.router'

export const routerApp: Middleware<unknown> = async (
	ctx,
	next
): Promise<void> => {
	const { req, res, body } = ctx
	if (!req.url) return

	const parserURL = new URL(req.url, `http://${req.headers.host}`)
	const path = parserURL.pathname

	if (!rootAuthRouter.includes(path)) {
		await responseNotFoundApi('Not founded auth api', res)
	}

	await authRouter(path, req, res, body)

	await next()
}
