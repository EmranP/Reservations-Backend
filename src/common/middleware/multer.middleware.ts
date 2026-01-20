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
				await fs.mkdir(assetsPath(__dirname, `${pathAssets}/img/user`))

				logger.error('Folder img/user is created!')
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

export const multerFormData: Middleware<unknown> = async (
	ctx,
	next
): Promise<void> => {
	const { req, res } = ctx
	const contentType = req.headers['content-type'] || ''
	const pathAssets = '../../../assets'

	ctx.file = {
		fileBufferData: undefined,
	}
	ctx.body = {}

	if (contentType.includes('multipart/form-data') && req.method === 'POST') {
		const match = contentType.match(/boundary=(.+)$/)

		if (!match) {
			res.statusCode = 400
			res.end(JSON.stringify({ error: 'Invalid multipart/form-data' }))
			return
		}

		const boundary = '--' + match[1]
		const chunks: Buffer[] = []

		for await (const chunk of req) {
			chunks.push(chunk)
		}

		const bodyBuffer = Buffer.concat(chunks)
		const parts = bodyBuffer.toString('latin1').split(boundary).slice(1, -1)

		for (const part of parts) {
			const [rawHeaders, rawBody] = part.split('\r\n\r\n')

			if (!rawHeaders || !rawBody) continue

			const headers = rawHeaders.split('\r\n')
			const disposition = headers
				.find(h => h.toLowerCase().startsWith('content-disposition'))
				?.trim()

			if (!disposition) continue

			const nameMatch = disposition.match(/name="(.+?)"/)
			const fileMatch =
				disposition.match(/filename="(.+?)"/) ||
				disposition.match(/filename\*=UTF-8''(.+)/)

			const bodyParser = rawBody.slice(0, -2)

			/* ---------- FILE ---------- */
			if (fileMatch) {
				const contentTypeFile = headers
					.find(h => h.toLowerCase().startsWith('content-type'))
					?.split(': ')[1]

				if (
					contentTypeFile === 'image/png' ||
					contentTypeFile === 'image/jpg' ||
					contentTypeFile === 'image/jpeg'
				) {
					try {
						await fs.access(
							assetsPath(__dirname, `${pathAssets}/img/rooms`),
							fs.constants.F_OK
						)
						logger.info('Folder img/user is have')
					} catch (error) {
						await fs.mkdir(assetsPath(__dirname, `${pathAssets}/img/rooms`))

						logger.error('Folder img/rooms is created!')
					}

					if (ctx.file && ctx.file.fileBufferData === undefined) {
						ctx.file.fileBufferData = Buffer.from(bodyParser, 'binary')
					}
				}

				continue
			}

			/* ---------- FIELD ---------- */
			if (nameMatch) {
				const fieldName = nameMatch[1]
				const fieldValue = bodyParser.toString()
				let parsed: any = fieldValue

				try {
					parsed = JSON.parse(fieldValue)
				} catch (error) {}

				if (fieldName) {
					ctx.body = {
						...(ctx.body ?? {}),
						[fieldName]: parsed,
					}
				}
			}
		}
	}

	await next()
}
