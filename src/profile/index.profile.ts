import { pool } from '../app/check-db.app'
import { logger } from '../common/utils/log/logger.log'
import { ProfileController } from './profile.controller'
import { ProfileModel } from './profile.model'
import { ProfileService } from './profile.service'

// Model
export const profileModel = new ProfileModel(pool, logger)
// Service
export const profileService = new ProfileService(profileModel, logger)
// Controller
export const profileController = new ProfileController(profileService, logger)
