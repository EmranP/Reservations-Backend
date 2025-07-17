import { Pool } from 'pg'
import { DB_CONFIG } from '../config/db.config'
import { logger } from '../utils/log/logger.log'

export const pool = new Pool(DB_CONFIG)

export const checkDB = async (): Promise<void> => {
	try {
		const res = await pool.query('SELECT NOW();')

		if (!res.rows.length) {
			throw new Error('db has null')
		}

		logger.info('Database connected:', res.rows[0])
	} catch (error) {
		if (error instanceof Error) {
			logger.error('Database connection error:', error.message)
		} else {
			logger.error('Something was wrong from checkDB')
		}
	}
}
