import { URL } from 'url'
import { authRouter } from '../../auth/auth.router'
import { isAuth } from '../../auth/middleware/isAuth.auth'
import { rootUserRouter } from '../../common/constants/admin.constant'
import { rootAuthRouter } from '../../common/constants/auth.constant'
import { isPathWithQuery } from '../../common/constants/global.constant'
import { rootProfileRouter } from '../../common/constants/profile.constant'
import type { IAppQueryParams } from '../../common/types/app/app.type'
import type { Middleware } from '../../common/types/middlewares/app.types-middleware'
import { responseNotFoundApi } from '../../common/utils/app/errorResponse.utils'
import { profileRouter } from './profile/profile.route'
import { userRouter } from './user/admin.route'

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
	const searchAuthActivateForgetQuery = pathOption.path.search('forget/')

	// Convert
	const convertAuthQueryRoute = pathOption.path.slice(
		searchAuthActivateQuery + 9,
		pathOption.path.length
	)

	// Checking
	const isAuthActivatePath = path.slice(0, searchAuthActivateQuery + 8)
	const isAuthActivateRepaid = path.slice(0, searchAuthActivateRepaidQuery + 15)
	const isAuthActivateForget = path.slice(0, searchAuthActivateForgetQuery + 15)

	if (searchAuthActivateQuery !== -1) {
		pathOption.query = decodeURIComponent(convertAuthQueryRoute)
	} else if (searchAuthActivateForgetQuery !== -1) {
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
	const isPathAuthForgetHref = isPathWithQuery(
		parserURL.origin,
		'auth/forget/activate',
		pathOption.query !== null ? `/${pathOption.query}` : ''
	)
	const isPathAuthGoogleUrlWithState = isPathWithQuery(
		parserURL.origin,
		'auth/google/url',
		pathOption.searchParams
	)
	const isPathAuthGithubUrlWithState = isPathWithQuery(
		parserURL.origin,
		'auth/github/url',
		pathOption.searchParams
	)

	if (
		!rootAuthRouter.includes(path) &&
		!rootUserRouter.includes(path) &&
		!rootProfileRouter.includes(path) &&
		parserURL.href !== isPathUserHref &&
		parserURL.href !== isPathAuthHref &&
		parserURL.href !== isPathAuthRepaidHref &&
		parserURL.href !== isPathAuthForgetHref &&
		parserURL.href !== isPathAuthGoogleUrlWithState &&
		parserURL.href !== isPathAuthGithubUrlWithState
	) {
		await responseNotFoundApi('Not founded auth api', res)
	}

	if (
		rootAuthRouter.includes(path) ||
		parserURL.href === isPathAuthHref ||
		parserURL.href === isPathAuthRepaidHref ||
		parserURL.href === isPathAuthForgetHref ||
		parserURL.href === isPathAuthGoogleUrlWithState ||
		parserURL.href === isPathAuthGithubUrlWithState
	) {
		await authRouter(
			authMiddleware,
			path,
			pathOption,
			isAuthActivatePath,
			isAuthActivateForget,
			req,
			res,
			body,
			cookies
		)
	}

	if (rootUserRouter.includes(path) || parserURL.href === isPathUserHref) {
		await userRouter(authMiddleware, path, pathOption, req, res, body, next)
	}

	if (rootProfileRouter.includes(path)) {
		await profileRouter(authMiddleware, path, pathOption, req, res, body, next)
	}

	await next()
}
