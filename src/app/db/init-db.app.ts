import { readFile } from 'fs/promises'
import path from 'path'
import { logger } from '../../common/utils/log/logger.log'
import { pool } from '../check-db.app'

export const initDB = async (): Promise<void> => {
	try {
		const initExtensionSqlDB = await readFile(
			path.join(__dirname, '../../../db/migrations/extension.db.sql'),
			'utf-8'
		)
		const initHandlerSqlDB = await readFile(
			path.join(__dirname, '../../../db/migrations/handler.db.sql'),
			'utf-8'
		)
		const initTypeSqlDB = await readFile(
			path.join(__dirname, '../../../db/migrations/type.db.sql'),
			'utf-8'
		)
		const initTablesSqlDB = await readFile(
			path.join(__dirname, '../../../db/migrations/tables.db.sql'),
			'utf-8'
		)
		const initTriggerSqlDB = await readFile(
			path.join(__dirname, '../../../db/migrations/trigger.db.sql'),
			'utf-8'
		)

		await pool.query(initExtensionSqlDB)
		await pool.query(initHandlerSqlDB)
		await pool.query(initTypeSqlDB)
		await pool.query(initTablesSqlDB)
		await pool.query(initTriggerSqlDB)

		logger.info('✅ Database success init')
	} catch (error) {
		logger.error('Database connection error:', error)
		throw error
	}
}
