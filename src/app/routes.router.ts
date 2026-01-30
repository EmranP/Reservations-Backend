import { URL } from 'url'
import { adminRoomRouter } from '../admin/route/admin.route'
import { userRouter } from '../admin/route/user.route'
import { authRouter } from '../auth/auth.router'
import { isAuth } from '../auth/middleware/isAuth.auth'
import { rootRoomRouter } from '../common/constants/admin.constant'
import { rootAuthRouter } from '../common/constants/auth.constant'
import { isPathWithQuery } from '../common/constants/global.constant'
import { rootProfileRouter } from '../common/constants/profile.constant'
import type { IAppQueryParams } from '../common/types/app/app.type'
import type { Middleware } from '../common/types/middlewares/app.types-middleware'
import { responseNotFoundApi } from '../common/utils/app/errorResponse.utils'
import { profileRouter } from '../profile/profile.route'

export const routerApp: Middleware<unknown> = async (
	ctx,
	next
): Promise<void> => {
	const { req, res, body, cookies, file } = ctx
	if (!req.url) return

	const authMiddleware = await isAuth(req, res)

	const parserURL = new URL(req.url, `http://${req.headers.host}`)
	const pathOrigin = parserURL.origin
	const pathWithQuery = `${parserURL.pathname}${parserURL.search}`
	const path = parserURL.search ? pathWithQuery : parserURL.pathname

	const convertQueryParams = JSON.stringify({
		queryParams: parserURL.searchParams,
		path: parserURL.pathname,
		searchParams: parserURL.search,
	})
	const pathOption: IAppQueryParams = JSON.parse(convertQueryParams)

	// Search
	const searchAuthActivateQuery = pathOption.path.search('activate/')
	const searchAuthActivateForgetQuery = pathOption.path.search('forget/')

	// Convert
	const convertAuthQueryRoute = pathOption.path.slice(
		searchAuthActivateQuery + 9,
		pathOption.path.length
	)

	// Checking
	const isAuthActivatePath = path.slice(0, searchAuthActivateQuery + 8)
	const isAuthActivateForget = path.slice(0, searchAuthActivateForgetQuery + 15)

	if (searchAuthActivateQuery !== -1) {
		pathOption.query = decodeURIComponent(convertAuthQueryRoute)
	} else if (searchAuthActivateForgetQuery !== -1) {
		pathOption.query = decodeURIComponent(convertAuthQueryRoute)
	} else {
		pathOption.query = null
	}

	const isPathAuthHref = isPathWithQuery(
		pathOrigin,
		'auth/activate',
		`/${pathOption.query}`
	)
	const isPathAuthRepaidHref = isPathWithQuery(
		pathOrigin,
		'auth/repaid/activate',
		`/${pathOption.query}`
	)
	const isPathAuthForgetHref = isPathWithQuery(
		pathOrigin,
		'auth/forget/activate',
		pathOption.query !== null ? `/${pathOption.query}` : ''
	)
	// OAuth
	const isPathAuthGoogleUrlWithState = isPathWithQuery(
		pathOrigin,
		'auth/google/url',
		pathOption.searchParams
	)
	const isPathAuthGithubUrlWithState = isPathWithQuery(
		pathOrigin,
		'auth/github/url',
		pathOption.searchParams
	)
	const isPathAuthYandexUrlWithState = isPathWithQuery(
		pathOrigin,
		'auth/yandex/url',
		pathOption.searchParams
	)
	// Room
	const isPathGetAllRoom = isPathWithQuery(
		pathOrigin,
		'rooms',
		pathOption.searchParams
	)
	const isPathGetOneRoom = isPathWithQuery(
		pathOrigin,
		'room',
		pathOption.searchParams
	)
	const isPathEditOneRoom = isPathWithQuery(
		pathOrigin,
		'room/edit',
		pathOption.searchParams
	)
	const isPathRemoveRoom = isPathWithQuery(
		pathOrigin,
		'room/remove',
		pathOption.searchParams
	)
	// Rooms Image
	const isPathUploadImageRoom = isPathWithQuery(
		pathOrigin,
		'room/upload/image',
		pathOption.searchParams
	)
	const isPathDeleteImageRoom = isPathWithQuery(
		pathOrigin,
		'room/delete/image',
		pathOption.searchParams
	)
	// Users
	const isPathUsersAllHref = isPathWithQuery(
		pathOrigin,
		'users',
		pathOption.searchParams
	)
	const isPathUserOneHref = isPathWithQuery(
		pathOrigin,
		'user',
		pathOption.searchParams
	)
	const isPathUserEditHref = isPathWithQuery(
		pathOrigin,
		'user/edit',
		pathOption.searchParams
	)
	const isPathUserDeleteHref = isPathWithQuery(
		pathOrigin,
		'user/remove',
		pathOption.searchParams
	)

	if (
		!rootAuthRouter.includes(path) &&
		!rootProfileRouter.includes(path) &&
		!rootRoomRouter.includes(path) &&
		// Auth
		parserURL.href !== isPathAuthHref &&
		parserURL.href !== isPathAuthRepaidHref &&
		parserURL.href !== isPathAuthForgetHref &&
		// OAuth
		parserURL.href !== isPathAuthGoogleUrlWithState &&
		parserURL.href !== isPathAuthGithubUrlWithState &&
		parserURL.href !== isPathAuthYandexUrlWithState &&
		// Room
		parserURL.href !== isPathGetAllRoom &&
		parserURL.href !== isPathGetOneRoom &&
		parserURL.href !== isPathEditOneRoom &&
		parserURL.href !== isPathRemoveRoom &&
		parserURL.href !== isPathUploadImageRoom &&
		parserURL.href !== isPathDeleteImageRoom &&
		// Users
		parserURL.href !== isPathUsersAllHref &&
		parserURL.href !== isPathUserOneHref &&
		parserURL.href !== isPathUserEditHref &&
		parserURL.href !== isPathUserDeleteHref
	) {
		await responseNotFoundApi('Not founded auth api', res)
	}

	if (
		rootAuthRouter.includes(path) ||
		parserURL.href === isPathAuthHref ||
		parserURL.href === isPathAuthRepaidHref ||
		parserURL.href === isPathAuthForgetHref ||
		parserURL.href === isPathAuthGoogleUrlWithState ||
		parserURL.href === isPathAuthGithubUrlWithState ||
		parserURL.href === isPathAuthYandexUrlWithState
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

	if (
		parserURL.href === isPathUsersAllHref ||
		parserURL.href === isPathUserOneHref ||
		parserURL.href === isPathUserEditHref ||
		parserURL.href === isPathUserDeleteHref
	) {
		await userRouter(
			authMiddleware,
			path,
			pathOption,
			req,
			res,
			body,
			file,
			next
		)
	}

	if (rootProfileRouter.includes(path)) {
		await profileRouter(authMiddleware, path, req, res, body, file, next)
	}

	if (
		rootRoomRouter.includes(path) ||
		parserURL.href === isPathGetAllRoom ||
		parserURL.href === isPathGetOneRoom ||
		parserURL.href === isPathEditOneRoom ||
		parserURL.href === isPathRemoveRoom ||
		parserURL.href === isPathUploadImageRoom ||
		parserURL.href === isPathDeleteImageRoom
	) {
		await adminRoomRouter(
			authMiddleware,
			path,
			pathOption,
			req,
			res,
			body,
			file
		)
	}

	await next()
}
