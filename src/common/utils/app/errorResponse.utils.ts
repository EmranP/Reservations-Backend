import type { IncomingMessage, ServerResponse } from 'http'
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
