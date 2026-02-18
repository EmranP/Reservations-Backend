import { adminUserModel } from '../admin/users/index.user'
import { pool } from '../app/check-db.app'
import { logger } from '../common/utils/log/logger.log'
import { OrderController } from './order.controller'
import { OrderModel } from './order.model'
import { OrderService } from './order.service'

export const orderModel = new OrderModel(pool, logger)
export const orderService = new OrderService(orderModel, adminUserModel, logger)
export const orderController = new OrderController(orderService, logger)
