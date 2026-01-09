import fs from 'fs/promises'
import type { Middleware } from '../types/middlewares/app.types-middleware'
import { assetsPath } from '../utils/format/path.util'
import { logger } from '../utils/log/logger.log'

export const multer: Middleware<unknown> = async (ctx, next): Promise<void> => {
	const { req, res } = ctx
	const contentType = req.headers['content-type'] || ''
	const contentTypeMedias = {
		imagePng: contentType.includes('image/png'),
		imageJpg: contentType.includes('image/jpg'),
		imageJpeg: contentType.includes('image/jpeg'),
	}

	ctx.file = {
		fileBufferData: undefined,
		filename: '',
	}

	if (req.method === 'POST' || req.method === 'DELETE') {
		if (contentTypeMedias.imagePng || contentTypeMedias.imageJpg) {
			const pathAssets = '../../../assets'

			try {
				await fs.mkdir(assetsPath(__dirname, `${pathAssets}/img/user`), {
					recursive: true,
				})
				logger.info('Folder-assets is success created')
			} catch (error) {
				logger.error('Folder-assets is not success created')
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

				res.writeHead(500, {
					'content-type': 'application/json',
				})
				res.end(errorJson)

				return
			}
		}
	}

	await next()
}
