import { pool } from '../app/check-db.app'
import { logger } from '../common/utils/log/logger.log'
import { AdminController } from './admin.controller'
import { AdminModel } from './admin.model'
import { AdminService } from './admin.service'

const adminModel = new AdminModel(pool, logger)
const adminService = new AdminService(adminModel, logger)
export const adminController = new AdminController(adminService, logger)
