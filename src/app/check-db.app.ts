import { Pool } from 'pg'
import { DB_CONFIG } from '../common/config/db.config'
import { ApiError } from '../common/utils/log/exists-error.log'
import { logger } from '../common/utils/log/logger.log'

export const pool = new Pool(DB_CONFIG)

export const checkDB = async (): Promise<void> => {
	try {
		const res = await pool.query('SELECT NOW();')

		if (!res.rows.length || !res.rows[0]) {
			throw new Error('db has null')
		}

		logger.info(`Database connected: ${res.rows[0].now}`)
	} catch (error) {
		logger.error('Database connection error:', error)
		ApiError.BadRequest('Error with connection from  check-db app ')
	}
}
