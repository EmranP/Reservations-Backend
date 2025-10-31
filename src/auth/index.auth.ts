import { pool } from '../app/check-db.app'
import { logger } from '../common/utils/log/logger.log'
import { AuthController } from './auth.controller'
import { AuthModel } from './auth.model'
import { AuthService } from './auth.service'
import { TokenModel } from './token/token.model'
import { TokenService } from './token/token.service'

// Tokens
export const tokenModel = new TokenModel(pool)
export const tokenService = new TokenService(tokenModel, logger)
// Auth
export const authModel = new AuthModel(pool, logger)
export const authService = new AuthService(authModel, tokenService, logger)
export const authController = new AuthController(authService, logger)
