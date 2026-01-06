import type { IncomingMessage, ServerResponse } from 'http'
import { isRequestUserApp } from '../../common/utils/app/checkType.utils'
import { logger } from '../../common/utils/log/logger.log'
import type { IRequestUserApp } from '../types/token.type'

export const hasRole = async (
	roles: number[],
	req: IRequestUserApp | IncomingMessage,
	res: ServerResponse<IncomingMessage>,
	next?: () => Promise<void>
): Promise<`You don't have access` | undefined> => {
	const messageWarn = `You don't have access`

	if (
		isRequestUserApp(req) &&
		req.user?.role &&
		!roles.includes(Number(req.user.role))
	) {
		logger.warn(messageWarn)

		return messageWarn
	}
}
