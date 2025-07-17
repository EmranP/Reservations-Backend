import { readFile } from 'fs/promises'
import path from 'path'
import { pool } from '../app/check-db.app'
import { logger } from '../utils/log/logger.log'

export const initDB = async (): Promise<void> => {
	try {
		const initSqlDB = await readFile(
			path.join(__dirname, './migrations/init-db.migrations.sql'),
			'utf-8'
		)

		await pool.query(initSqlDB)
		logger.info('✅ База данных успешно проинициализирована')
	} catch (error) {
		if (error instanceof Error) logger.error(error.message)
		else logger.error('Error from initDB')
	}
}
