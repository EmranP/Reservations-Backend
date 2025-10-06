import { createServer } from 'node:http'
import { compose } from '../middleware/compose.middleware'
import type {
	IContext,
	Middleware,
} from '../shared/types/middlewares/app.types-middleware'
import { logger } from '../utils/log/logger.log'

export class App {
	private middlewares: Middleware[] = []

	use(mw: Middleware) {
		this.middlewares.push(mw)
	}

	listen(port: number, hostname: string) {
		const server = createServer((req, res) => {
			const ctx: IContext = { req, res }
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
