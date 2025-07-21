import { readFile } from 'fs/promises'
import path from 'path'
import { pool } from '../app/check-db.app'
import { logger } from '../utils/log/logger.log'

export const initDB = async (): Promise<void> => {
	try {
		const initHandlerSqlDB = await readFile(
			path.join(__dirname, './migrations/handler.db.sql'),
			'utf-8'
		)
		const initTablesSqlDB = await readFile(
			path.join(__dirname, './migrations/tables.db.sql'),
			'utf-8'
		)
		const initTriggerSqlDB = await readFile(
			path.join(__dirname, './migrations/trigger.db.sql'),
			'utf-8'
		)

		const queries = [
			pool.query(initHandlerSqlDB),
			pool.query(initTablesSqlDB),
			pool.query(initTriggerSqlDB),
		]

		Promise.all(queries)

		logger.info('✅ База данных успешно проинициализирована')
	} catch (error) {
		logger.error('Database connection error:', error)
		throw error
	}
}
