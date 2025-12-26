import type { Logger } from 'winston'
import {
	APP_CONFIG,
	APP_OAUTH_YANDEX_CONFIG,
} from '../../../common/config/app.config'
import { generateOAuthYandexLink } from '../../../common/utils/app/generate.utils'
import { ApiError } from '../../../common/utils/log/exists-error.log'
import type { AuthModel } from '../../auth.model'
import type { TokenService } from '../../token/token.service'
import type { ICommonOAuthBodyData } from '../../types/common.type'
import type { OAuthModel } from '../oauth.model'
import { OAuthService } from '../oauth.service'

export class OAuthYandexService extends OAuthService {
	constructor(
		private model: OAuthModel,
		private service: OAuthService,
		private authMode: AuthModel,
		private tokenService: TokenService,
		private logger: Logger
	) {
		super()
	}

	private yandexClientID = APP_OAUTH_YANDEX_CONFIG.YANDEX_CLIENT_ID
	private yandexClientSecret = APP_OAUTH_YANDEX_CONFIG.YANDEX_CLIENT_SECRET
	private yandexClientRedirect = APP_OAUTH_YANDEX_CONFIG.YANDEX_CLIENT_REDIRECT

	private defaultUserPass = APP_CONFIG.USER_DEFAULT_PASS

	async getYandexUrl(state: string | undefined): Promise<ApiError | string> {
		return await this.service.getOauthUrl(
			state,
			this.yandexClientID,
			this.yandexClientSecret,
			this.yandexClientRedirect,
			() =>
				generateOAuthYandexLink(
					this.yandexClientID,
					'code',
					this.yandexClientRedirect,
					state
				)
		)
	}

	async getCommonYandexBodyData(): Promise<ApiError | ICommonOAuthBodyData> {
		if (
			!this.yandexClientID ||
			!this.yandexClientSecret ||
			!this.yandexClientRedirect
		)
			return ApiError.InternalServer(
				'Yandex oauth config not set from common body data!'
			)

		const commonData: ICommonOAuthBodyData = {
			client_id: this.yandexClientID,
			client_secret: this.yandexClientSecret,
			redirect_uri: this.yandexClientRedirect,
		}

		return commonData
	}

	async yandexCodeHandler(code: string, state: string) {}
}
