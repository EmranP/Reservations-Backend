import dotenv from 'dotenv'
import { App } from './app/app'
import { checkDB } from './app/check-db.app'
import { initDB } from './db/init-db.app'
import { cookieParser } from './middleware/cookie-parser.middleware'
import { cors } from './middleware/cors.middleware'
import { helmetMiddleware } from './middleware/helmet.middleware'
import { json } from './middleware/json.middleware'
import { routerApp } from './routes/routes.router'

dotenv.config()

const app = new App()

const port = Number(process.env.PORT) || 4200
const hostname = process.env.HOSTNAME || 'localhost'

// Middlewares
app.use(helmetMiddleware)
app.use(json)
app.use(cookieParser)
app.use(cors)
// Routes
app.router(routerApp)

// Start app
const startApp = async (): Promise<void> => {
	try {
		// Checking DB
		await checkDB()
		await initDB()

		app.listen(port, hostname)
	} catch (error) {
		console.error(`❌ Ошибка запуска сервера: ${error}`)
		process.exit(1)
	}
}

startApp()
