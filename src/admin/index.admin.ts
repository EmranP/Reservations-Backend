import { pool } from '../app/check-db.app'
import { clientS3Storage } from '../app/s3/init-cloud-storage.app'
import { logger } from '../common/utils/log/logger.log'
import { AdminController } from './admin.controller'
import { AdminModel } from './admin.model'
import { AdminService } from './admin.service'

export const adminModel = new AdminModel(pool, logger)
export const adminService = new AdminService(
	adminModel,
	clientS3Storage,
	logger
)
export const adminController = new AdminController(adminService, logger)
