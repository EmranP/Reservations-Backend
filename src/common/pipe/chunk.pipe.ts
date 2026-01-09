import type { IncomingMessage } from 'http'
import type { IContextFiles } from '../types/middlewares/app.types-middleware'

export const readFilesApi = async (
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

			console.log('before multer', file)
			if (file && typeof file?.fileBufferData === 'undefined') {
				file.fileBufferData = Buffer.from(raw, 'binary')
				console.log('after multer', file)
			}
		})
}
