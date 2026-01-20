import { pool } from '../../app/check-db.app'
import { logger } from '../../common/utils/log/logger.log'
import { UserController } from './user.controller'
import { UserModel } from './user.model'
import { UserService } from './user.service'

export const adminUserModel = new UserModel(pool, logger)
export const adminUserService = new UserService(adminUserModel, logger)
export const adminUserController = new UserController(adminUserService, logger)
