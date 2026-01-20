import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger } from 'winston'
import { ApiError } from '../log/exists-error.log'
import { writeHeadData } from './writeHeadData.utils'

export const responseBadRequest = async (
	message: string,
	res: ServerResponse<IncomingMessage>,
	statusCode: number = 400
): Promise<void> => {
	const { status, contentData } = writeHeadData(statusCode)
	res.writeHead(status, contentData)

	const errorMessage = { message }
	const jsonData = JSON.stringify(errorMessage)

	res.end(jsonData)
}

export const responseNotFoundApi = async (
	message: string,
	res: ServerResponse<IncomingMessage>,
	statusCode: number = 404
): Promise<void> => {
	const { status, contentData } = writeHeadData(statusCode)
	res.writeHead(status, contentData)

	const errorMessage = { message }
	const jsonData = JSON.stringify(errorMessage)

	res.end(jsonData)
}

export const isErrorHandler = (error: unknown, message: string): string =>
	error instanceof Error ? error.message : message

export const responseInternalServer = async (
	error: unknown,
	res: ServerResponse<IncomingMessage>,
	customMessage: string,
	logger: Logger
) => {
	const isError = isErrorHandler(error, customMessage)
	const errorRes = ApiError.BadRequest(isError)
	logger.error(errorRes.message)

	await responseBadRequest(errorRes.message, res, 500)
}

export const responseErrorDB = (
	logger: Logger,
	error: unknown,
	titleMessage: string
): null => {
	logger.error(
		titleMessage,
		error instanceof Error ? error.message : 'Internal-server database'
	)

	return null
}
