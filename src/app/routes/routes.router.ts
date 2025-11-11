import { URL } from 'url'
import { isAuth } from '../../auth/middleware/isAuth.auth'
import {
	isPathWithQuery,
	rootAuthRouter,
	rootUserRouter,
} from '../../common/constants/api.constant'
import type { IAppQueryParams } from '../../common/types/app/app.type'
import type { Middleware } from '../../common/types/middlewares/app.types-middleware'
import { responseNotFoundApi } from '../../common/utils/app/errorResponse.utils'
import { authRouter } from './auth/auth.router'
import { userRouter } from './user/user.route'

export const routerApp: Middleware<unknown> = async (
	ctx,
	next
): Promise<void> => {
	const { req, res, body, cookies } = ctx
	if (!req.url) return

	const authMiddleware = await isAuth(req, res)

	const parserURL = new URL(req.url, `http://${req.headers.host}`)
	const pathWithQuery = `${parserURL.pathname}${parserURL.search}`
	const path = parserURL.search ? pathWithQuery : parserURL.pathname

	const convertQueryParams = JSON.stringify({
		query: parserURL.searchParams,
		path: parserURL.pathname,
		searchParams: parserURL.search,
	})
	const pathOption: IAppQueryParams = JSON.parse(convertQueryParams)
	const isPathUserHref = isPathWithQuery(
		parserURL.origin,
		'user',
		pathOption.searchParams
	)

	if (
		!rootAuthRouter.includes(path) &&
		!rootUserRouter.includes(path) &&
		parserURL.href !== isPathUserHref
	) {
		await responseNotFoundApi('Not founded auth api', res)
	}

	if (rootAuthRouter.includes(path)) {
		await authRouter(authMiddleware, path, req, res, body, cookies)
	}

	if (rootUserRouter.includes(path) || parserURL.href === isPathUserHref) {
		await userRouter(authMiddleware, path, pathOption, req, res, body, next)
	}

	await next()
}
