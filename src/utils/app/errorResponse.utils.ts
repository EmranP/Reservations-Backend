import type { IncomingMessage, ServerResponse } from 'http'

export const responseBadRequest = async (
	message: string,
	res: ServerResponse<IncomingMessage>,
	statusCode: number = 400
): Promise<void> => {
	res.writeHead(statusCode, { 'Content-Type': 'application/json' })

	const errorMessage = { message }
	const jsonData = JSON.stringify(errorMessage)

	res.end(jsonData)
}

export const responseNotFoundApi = async (
	message: string,
	res: ServerResponse<IncomingMessage>,
	statusCode: number = 404
): Promise<void> => {
	res.writeHead(statusCode, { 'Content-Type': 'application/json' })

	const errorMessage = { message }
	const jsonData = JSON.stringify(errorMessage)

	res.end(jsonData)
}
