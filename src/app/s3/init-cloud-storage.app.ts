import { Client } from 'minio'
import type { Logger } from 'winston'
import { APP_MINIO_S3_CONFIG } from '../../common/config/app.config'
import { ensureDir } from '../../common/utils/app/fs.utils'
import { assetsPath } from '../../common/utils/format/path.util'

export const clientS3Storage = new Client({
	endPoint: APP_MINIO_S3_CONFIG.MINIO_END_POINT ?? 'localhost',
	port: Number(APP_MINIO_S3_CONFIG.MINIO_PORT) ?? 9000,
	useSSL: !Boolean(APP_MINIO_S3_CONFIG.MINIO_USE_SSL),
	accessKey: APP_MINIO_S3_CONFIG.MINIO_ACCESS_KEY,
	secretKey: APP_MINIO_S3_CONFIG.MINIO_SECRET_KEY,
})

export const userBucketName = 'users-bucket'
export const roomsBucketName = 'rooms-bucket'

export const initCloudStorage = async (logger: Logger) => {
	try {
		const storagePath = assetsPath(__dirname, '../../../../storage')

		await ensureDir(storagePath, logger, 'Storage')

		const existUserBucket = await clientS3Storage.bucketExists(userBucketName)
		const existRoomsBucket = await clientS3Storage.bucketExists(roomsBucketName)

		if (!existUserBucket) {
			await clientS3Storage.makeBucket(userBucketName, 'us-east-1')
			logger.warn('S3: User-bucket success created!')
		}

		if (!existRoomsBucket) {
			await clientS3Storage.makeBucket(roomsBucketName, 'us-east-1')
			logger.warn('S3: Rooms-bucket success created!')
		}
	} catch (error) {
		logger.error(
			error instanceof Error
				? error.message
				: 'Something was wrong from redis-init DB'
		)
	}
}
