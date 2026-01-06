import { pool } from '../app/check-db.app'
import { logger } from '../common/utils/log/logger.log'
import { UserController } from './user.controller'
import { UserModel } from './user.model'
import { UserService } from './user.service'

export const userModel = new UserModel(pool, logger)
export const userService = new UserService(userModel, logger)
export const userController = new UserController(userService, logger)
