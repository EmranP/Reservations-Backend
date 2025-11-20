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
		queryParams: parserURL.searchParams,
		path: parserURL.pathname,
		searchParams: parserURL.search,
	})
	const pathOption: IAppQueryParams = JSON.parse(convertQueryParams)

	// Query Route:

	// Search
	const searchAuthActivateQuery = pathOption.path.search('activate/')
	const searchAuthActivateRepaidQuery = pathOption.path.search('repaid/')

	// Convert
	const convertAuthQueryRoute = pathOption.path.slice(
		searchAuthActivateQuery + 9,
		pathOption.path.length
	)

	// Checking
	const isAuthActivatePath = path.slice(0, searchAuthActivateQuery + 8)
	const isAuthActivateRepaid = path.slice(0, searchAuthActivateRepaidQuery + 15)

	if (searchAuthActivateQuery !== -1) {
		pathOption.query = decodeURIComponent(convertAuthQueryRoute)
	} else {
		pathOption.query = null
	}

	// Add isPath for rooms && other where need query params
	const isPathUserHref = isPathWithQuery(
		parserURL.origin,
		'user',
		pathOption.searchParams
	)
	const isPathAuthHref = isPathWithQuery(
		parserURL.origin,
		'auth/activate',
		`/${pathOption.query}`
	)
	const isPathAuthRepaidHref = isPathWithQuery(
		parserURL.origin,
		'auth/repaid/activate',
		`/${pathOption.query}`
	)

	if (
		!rootAuthRouter.includes(path) &&
		!rootUserRouter.includes(path) &&
		parserURL.href !== isPathUserHref &&
		parserURL.href !== isPathAuthHref &&
		parserURL.href !== isPathAuthRepaidHref
	) {
		await responseNotFoundApi('Not founded auth api', res)
	}

	if (
		rootAuthRouter.includes(path) ||
		parserURL.href === isPathAuthHref ||
		parserURL.href === isPathAuthRepaidHref
	) {
		await authRouter(
			authMiddleware,
			path,
			pathOption,
			isAuthActivatePath,
			isAuthActivateRepaid,
			req,
			res,
			body,
			cookies
		)
	}

	if (rootUserRouter.includes(path) || parserURL.href === isPathUserHref) {
		await userRouter(authMiddleware, path, pathOption, req, res, body, next)
	}

	await next()
}
