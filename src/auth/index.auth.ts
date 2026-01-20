import { adminUserModel } from '../admin/user/index.user'
import { pool } from '../app/check-db.app'
import { logger } from '../common/utils/log/logger.log'
import { AuthTwoFactoryController } from './2fa/auth-2fa.controller'
import { AuthTwoFactoryChallengeModel } from './2fa/auth-2fa.model'
import { AuthTwoFactoryChallengeService } from './2fa/auth-2fa.service'
import { AuthController } from './auth.controller'
import { AuthModel } from './auth.model'
import { AuthService } from './auth.service'
import { EmailService } from './mail/email.service'
import { OAuthGithubController } from './oauth2.0/github/oauth.github.controller'
import { OAuthGithubService } from './oauth2.0/github/oauth.github.service'
import { OAuthGoogleController } from './oauth2.0/google/oauth.google.controller'
import { OAuthGoogleService } from './oauth2.0/google/oauth.google.service'
import { OAuthModel } from './oauth2.0/oauth.model'
import { OAuthService } from './oauth2.0/oauth.service'
import { OAuthTelegramController } from './oauth2.0/telegram/oauth.telegram.controller'
import { OAuthTelegramService } from './oauth2.0/telegram/oauth.telegram.service'
import { OAuthYandexController } from './oauth2.0/yandex/oauth.yandex.controller'
import { OAuthYandexService } from './oauth2.0/yandex/oauth.yandex.service'
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
	adminUserModel,
	tokenService,
	logger
)
// Email
export const authEmailService = new EmailService(
	logger,
	authModel,
	authTwoFactoryModel
)
// OAuth Common
export const oAuthModel = new OAuthModel(pool, logger)
export const oAuthService = new OAuthService()
// OAuth Google
export const oAuthGoogleService = new OAuthGoogleService(
	oAuthModel,
	oAuthService,
	authModel,
	tokenService,
	logger
)
// OAuth Github
export const oAuthGithubService = new OAuthGithubService(
	oAuthModel,
	oAuthService,
	authModel,
	tokenService,
	logger
)
// OAuth Yandex
export const oAuthYandexService = new OAuthYandexService(
	oAuthModel,
	oAuthService,
	authModel,
	tokenService,
	logger
)
// OAuth Telegram
export const oAuthTelegramService = new OAuthTelegramService(
	oAuthModel,
	oAuthService,
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

// OAuth Github
export const oAuthGithubController = new OAuthGithubController(
	oAuthGithubService,
	logger
)

// OAuth Yandex
export const oAuthYandexController = new OAuthYandexController(
	oAuthYandexService,
	logger
)

// OAuth Telegram
export const oAuthTelegramController = new OAuthTelegramController(
	oAuthTelegramService,
	logger
)
