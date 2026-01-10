import type {
	IContext,
	Middleware,
} from '../types/middlewares/app.types-middleware'
import { logAndThrowInternalServer } from '../utils/log/throw-error.log'

export function compose<T>(middleware: Middleware<T>[]) {
	return async function (ctx: IContext<T>) {
		let index = -1

		async function dispatch(i: number): Promise<void> {
			if (i <= index)
				return logAndThrowInternalServer('next() called multiple times')

			index = i

			console.log(middleware[i], i)
			const fn = middleware[i]
			if (!fn) return
			await fn(ctx, () => dispatch(i + 1))
		}

		await dispatch(0)
	}
}
