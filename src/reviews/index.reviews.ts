import { adminModel } from '../admin/index.admin'
import { pool } from '../app/check-db.app'
import { logger } from '../common/utils/log/logger.log'
import { ReviewsController } from './reviews.controller'
import { ReviewsModel } from './reviews.model'
import { ReviewsService } from './reviews.service'

export const reviewsModel = new ReviewsModel(pool, logger)
export const reviewsService = new ReviewsService(
	reviewsModel,
	adminModel,
	logger
)
export const reviewsController = new ReviewsController(reviewsService, logger)
