import { readFile } from 'fs/promises'
import path from 'path'
import { logger } from '../../common/utils/log/logger.log'
import { pool } from '../check-db.app'

export const initDB = async (): Promise<void> => {
	try {
		const initExtensionSqlDB = await readFile(
			path.join(__dirname, './migrations/extension.db.sql'),
			'utf-8'
		)
		const initHandlerSqlDB = await readFile(
			path.join(__dirname, './migrations/handler.db.sql'),
			'utf-8'
		)
		const initTypeSqlDB = await readFile(
			path.join(__dirname, './migrations/type.db.sql'),
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
		const initEditMigrate = await readFile(
			path.join(__dirname, './migrations/edit.db.sql'),
			'utf-8'
		)

		const queries = [
			pool.query(initExtensionSqlDB),
			pool.query(initHandlerSqlDB),
			pool.query(initTypeSqlDB),
			pool.query(initTablesSqlDB),
			pool.query(initTriggerSqlDB),
			pool.query(initEditMigrate),
		]

		Promise.all(queries)

		logger.info('✅ База данных успешно проинициализирована')
	} catch (error) {
		logger.error('Database connection error:', error)
		throw error
	}
}
