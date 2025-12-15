import dotenv from 'dotenv'
import { App, isDev } from './app/app'
import { checkDB } from './app/check-db.app'
import { initDB } from './app/db/init-db.app'
import { routerApp } from './app/routes/routes.router'
import { genJwks, genJwksLocal } from './auth/token/jwks.service'
import { APP_CONFIG } from './common/config/app.config'
import { cookieParser } from './common/middleware/cookie-parser.middleware'
import { cors } from './common/middleware/cors.middleware'
import { helmetMiddleware } from './common/middleware/helmet.middleware'
import { json } from './common/middleware/json.middleware'

dotenv.config({ path: '../.env' })

const app = new App()

const port = APP_CONFIG.PORT
const hostname = APP_CONFIG.HOSTNAME

// Middlewares
app.use(helmetMiddleware)
app.use(cookieParser)
app.use(cors)
app.use(json)
// Routes
app.use(routerApp)

// Start app
const startApp = async (): Promise<void> => {
	try {
		// Checking DB
		await checkDB()
		await initDB()

		// Generate Jwks
		if (isDev) await genJwksLocal().catch()
		else await genJwks().catch()

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
