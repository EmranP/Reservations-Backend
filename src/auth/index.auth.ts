import { pool } from '../app/check-db.app'
import { AuthController } from './auth.controller'
import { AuthModel } from './auth.model'
import { AuthService } from './auth.service'

export const authModel = new AuthModel(pool)
export const authService = new AuthService(authModel)
export const authController = new AuthController(authService)
