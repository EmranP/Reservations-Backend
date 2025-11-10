import { readFile } from 'fs/promises'
import path from 'path'
import { logger } from '../../common/utils/log/logger.log'
import { pool } from '../check-db.app'

export const initDB = async (isDev: boolean): Promise<void> => {
	try {
		const initExtensionSqlDB = await readFile(
			path.join(
				__dirname,
				isDev
					? '../../../db/migrations/extension.db.sql'
					: '../db/migrations/extension.db.sql'
			),
			'utf-8'
		)
		const initHandlerSqlDB = await readFile(
			path.join(
				__dirname,
				isDev
					? '../../../db/migrations/handler.db.sql'
					: '../db/migrations/handler.db.sql'
			),
			'utf-8'
		)
		const initTypeSqlDB = await readFile(
			path.join(
				__dirname,
				isDev
					? '../../../db/migrations/type.db.sql'
					: '../db/migrations/type.db.sql'
			),
			'utf-8'
		)
		const initTablesSqlDB = await readFile(
			path.join(
				__dirname,
				isDev
					? '../../../db/migrations/tables.db.sql'
					: '../db/migrations/tables.db.sql'
			),
			'utf-8'
		)
		const initTriggerSqlDB = await readFile(
			path.join(
				__dirname,
				isDev
					? '../../../db/migrations/trigger.db.sql'
					: '../db/migrations/trigger.db.sql'
			),
			'utf-8'
		)
		const initEditMigrate = await readFile(
			path.join(
				__dirname,
				isDev
					? '../../../db/migrations/edit.db.sql'
					: '../db/migrations/edit.db.sql'
			),
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

		logger.info('✅ Database success init')
	} catch (error) {
		logger.error('Database connection error:', error)
		throw error
	}
}
