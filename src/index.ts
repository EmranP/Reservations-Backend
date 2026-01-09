import dotenv from 'dotenv'
import { createClient } from 'redis'
import { App, isDev } from './app/app'
import { checkDB } from './app/check-db.app'
import { initDB } from './app/db/init-db.app'
import { routerApp } from './app/routes.router'
import {
	genJwks,
	genJwksLocal,
	getJwks,
	getJwksLocal,
} from './auth/token/jwks.service'
import type { IJwksData } from './auth/types/jwks.types'
import { APP_CONFIG } from './common/config/app.config'
import { cookieParser } from './common/middleware/cookie-parser.middleware'
import { cors } from './common/middleware/cors.middleware'
import { helmetMiddleware } from './common/middleware/helmet.middleware'
import { json } from './common/middleware/json.middleware'
import { multer } from './common/middleware/multer.middleware'
import { initRedisDB } from './common/redis/init-redis.db'
import { logger } from './common/utils/log/logger.log'

dotenv.config({ path: '../.env' })

const app = new App()
const port = APP_CONFIG.PORT
const hostname = APP_CONFIG.HOSTNAME
export const clientRedis = createClient()

// Middlewares
app.use(helmetMiddleware)
app.use(cookieParser)
app.use(cors)
app.use(json)
app.use(multer)
// Routes
app.use(routerApp)

// Start app
const startApp = async (): Promise<void> => {
	try {
		clientRedis.on('error', err => {
			if (err) {
				console.error('Redis Client Error')

				clientRedis.quit()

				process.exit(1)
			}
		})

		// Checking DB
		await checkDB()
		await initDB()
		await clientRedis.connect()

		// Generate Jwks
		let jwksData: undefined | null | IJwksData
		if (!isDev) {
			jwksData = await getJwksLocal()

			if (!jwksData) {
				await genJwksLocal().catch()
			}
		} else {
			jwksData = await getJwks()

			if (!jwksData) {
				await genJwks().catch()
			}
		}

		if (!jwksData) {
			logger.error('Jwks data is not have!')

			process.exit(1)
		}

		await initRedisDB(clientRedis, logger, jwksData)
		if (!port || !hostname) return

		app.listen(port, hostname)
	} catch (error) {
		console.error(
			`❌ Error running server: ${
				error instanceof Error ? error.message : 'Internal server'
			}`
		)
		process.exit(1)
	}
}

startApp()
