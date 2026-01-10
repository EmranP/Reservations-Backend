import type { IncomingMessage } from 'http'
import type { IContextFiles } from '../types/middlewares/app.types-middleware'
import { logger } from '../utils/log/logger.log'

export const getStreamFilesApi = async (
	req: IncomingMessage,
	file: IContextFiles | undefined
): Promise<void> => {
	let chunks = [] as Array<Buffer>
	req
		.on('data', (chunk: Buffer) => {
			chunks.push(chunk)
		})
		.on('end', () => {
			const raw = Buffer.concat(chunks).toString('binary')

			if (file && typeof file.fileBufferData === 'undefined') {
				logger.debug('Get stream files')
				file.fileBufferData = Buffer.from(raw, 'binary')
				console.log('after multer', file)
			}
		})
}
