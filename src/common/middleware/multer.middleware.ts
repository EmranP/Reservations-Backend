import fs from 'fs/promises'
import type { Middleware } from '../types/middlewares/app.types-middleware'
import { responseBadRequest } from '../utils/app/errorResponse.utils'
import { assetsPath } from '../utils/format/path.util'
import { logger } from '../utils/log/logger.log'

export const multer: Middleware<unknown> = async (ctx, next): Promise<void> => {
	const { req, res } = ctx
	const contentType = req.headers['content-type'] || ''
	const contentTypeApp = { 'Content-Type': 'application/json' }
	const contentTypeMedias = {
		imagePng: contentType.includes('image/png'),
		imageJpg: contentType.includes('image/jpg'),
		imageJpeg: contentType.includes('image/jpeg'),
	}
	const pathAssets = '../../../assets'

	ctx.file = {
		fileBufferData: undefined,
	}

	if (
		(contentType.includes('image') && req.method === 'POST') ||
		(contentType.includes('vide') && req.method === 'POST') ||
		(contentType.includes('image') && req.method === 'DELETE') ||
		(contentType.includes('vide') && req.method === 'DELETE')
	) {
		if (
			contentTypeMedias.imagePng ||
			contentTypeMedias.imageJpg ||
			contentTypeMedias.imageJpeg
		) {
			try {
				await fs.mkdir(assetsPath(__dirname, `${pathAssets}/img/user`), {
					recursive: true,
				})
				logger.warn('Folder-assets is success created!')
			} catch (error) {
				logger.error('Folder-assets is not success created!')

				return
			}

			try {
				await fs.access(
					assetsPath(__dirname, `${pathAssets}/img/user`),
					fs.constants.F_OK
				)
				logger.info('Folder img/user is have')
			} catch (error) {
				const errorJson = JSON.stringify({
					message: 'Folder img/user is not have, please repaid req',
				})

				logger.error('Folder img/user is not have')

				res.writeHead(500, contentTypeApp)
				res.end(errorJson)

				return
			}

			const buffer = await new Promise<Buffer>((resolve, reject) => {
				let chunks = [] as Array<Buffer>

				req.on('data', chunk => chunks.push(chunk))
				req.on('end', () => resolve(Buffer.concat(chunks)))
				req.on('error', reject)
			})

			if (!ctx.file) {
				const errorJson = JSON.stringify({
					message: 'Ctx file is not added!',
				})

				logger.error('Ctx file is not added!')

				res.writeHead(500, contentTypeApp)
				res.end(errorJson)

				return
			}

			if (ctx.file.fileBufferData === undefined) {
				ctx.file.fileBufferData = buffer
			}
		} else {
			await responseBadRequest(
				'File format is not correct must be: png, jpg, jpeg',
				res
			)

			return
		}
	}

	await next()
}
