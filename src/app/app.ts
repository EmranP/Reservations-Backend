import { createServer } from 'node:http'
import { compose } from '../common/middleware/compose.middleware'
import type {
	IContext,
	Middleware,
} from '../common/types/middlewares/app.types-middleware'
import { logger } from '../common/utils/log/logger.log'

export class App<T> {
	private middlewares: Middleware<T>[] = []

	use(mw: Middleware<T>) {
		this.middlewares.push(mw)
	}

	listen(port: number, hostname: string) {
		const server = createServer((req, res) => {
			const ctx: IContext<T> = { req, res }
			const appHandler = compose(this.middlewares)

			appHandler(ctx).catch(err => {
				logger.error(err)
				res.statusCode = 500
				res.end(`❌ Ошибка запуска сервера : ${err}`)
			})
		})

		server.listen(port, hostname, () => {
			logger.http(`🚀 Сервер запущен на http://${hostname}:${port}`)
		})
	}
}
