import { pool } from '../app/check-db.app'
import { logger } from '../common/utils/log/logger.log'
import { PaymentApi } from './payment.api'
import { PaymentController } from './payment.controller'
import { PaymentModel } from './payment.model'
import { PaymentService } from './payment.service'

const paymentModel = new PaymentModel(pool, logger)
const paymentApi = new PaymentApi()
const paymentService = new PaymentService(paymentModel, paymentApi, logger)
export const paymentController = new PaymentController(paymentService, logger)
