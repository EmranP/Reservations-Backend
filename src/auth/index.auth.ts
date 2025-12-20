import { pool } from '../app/check-db.app'
import { logger } from '../common/utils/log/logger.log'
import { userModel } from '../user/index.user'
import { AuthTwoFactoryController } from './2fa/auth-2fa.controller'
import { AuthTwoFactoryChallengeModel } from './2fa/auth-2fa.model'
import { AuthTwoFactoryChallengeService } from './2fa/auth-2fa.service'
import { AuthController } from './auth.controller'
import { AuthModel } from './auth.model'
import { AuthService } from './auth.service'
import { EmailService } from './mail/email.service'
import { OAuthGoogleController } from './oauth2.0/google/oauth.google.controller'
import { OAuthGoogleService } from './oauth2.0/google/oauth.google.service'
import { OAuthModel } from './oauth2.0/oauth.model'
import { TokenModel } from './token/token.model'
import { TokenService } from './token/token.service'

// Tokens
export const tokenModel = new TokenModel(pool)
export const tokenService = new TokenService(tokenModel, logger)
// Auth Model
export const authModel = new AuthModel(pool, logger)
// 2FA
export const authTwoFactoryModel = new AuthTwoFactoryChallengeModel(
	pool,
	logger
)
export const authTwoFactoryService = new AuthTwoFactoryChallengeService(
	authTwoFactoryModel,
	authModel,
	tokenService,
	logger
)
// Auth Service
export const authService = new AuthService(
	authModel,
	authTwoFactoryModel,
	authTwoFactoryService,
	userModel,
	tokenService,
	logger
)
// Email
export const authEmailService = new EmailService(
	logger,
	authModel,
	authTwoFactoryModel
)
// OAuth Google
export const oAuthGoogleModel = new OAuthModel(pool, logger)
export const oAuthGoogleService = new OAuthGoogleService(
	oAuthGoogleModel,
	authModel,
	tokenService,
	logger
)
// Controller
export const authController = new AuthController(
	authService,
	authEmailService,
	logger
)
// 2FA
export const authTwoFactoryController = new AuthTwoFactoryController(
	authTwoFactoryService,
	authEmailService,
	logger
)
// OAuth Google
export const oAuthGoogleController = new OAuthGoogleController(
	oAuthGoogleService,
	logger
)
