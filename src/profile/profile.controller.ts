import fs from 'fs/promises'
import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger } from 'winston'
import { AuthBaseConfig } from '../auth/abstract/auth-config.base'
import type { IRequestUserApp } from '../auth/types/token.type'
import type { IContextFiles } from '../common/types/middlewares/app.types-middleware'
import { responseInternalServer } from '../common/utils/app/errorResponse.utils'
import { assetsPath } from '../common/utils/format/path.util'
import type { EditProfileDto } from './dto/edit-profile.dto'
import type { ProfileService } from './profile.service'

export class ProfileController extends AuthBaseConfig {
	constructor(private service: ProfileService, private logger: Logger) {
		super()
	}

	async findProfileMe(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>
	): Promise<void> {
		try {
			const userId = req.user?.sub
			const userProfile = await this.service.findOneProfile(userId)

			if (
				'message' in userProfile &&
				userProfile.message &&
				userProfile.status
			) {
				const errorData = JSON.stringify({ message: userProfile.message })

				res.writeHead(userProfile.status ?? 500, this.headData.contentData)
				res.end(errorData)

				return
			}

			const jsonData = JSON.stringify(userProfile)

			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from get profile-me!',
				this.logger
			)
		}
	}

	async editProfileMe(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		body: EditProfileDto
	): Promise<void> {
		try {
			const userId = req.user?.sub
			const updateUserProfile = await this.service.editProfile(userId, body)

			if ('status' in updateUserProfile) {
				const errorData = JSON.stringify({ message: updateUserProfile.message })

				res.writeHead(
					updateUserProfile.status ?? 500,
					this.headData.contentData
				)
				res.end(errorData)

				return
			}

			const jsonData = JSON.stringify(updateUserProfile)

			res.writeHead(201, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from update/edit profile!',
				this.logger
			)
		}
	}

	async uploadProfile(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>,
		fileBody: IContextFiles
	): Promise<void> {
		try {
			const userId = req.user?.sub
			const pathAssets = '../../assets'
			console.log('controller', fileBody)
			if (
				fileBody.fileBufferData === null ||
				typeof fileBody.fileBufferData === 'undefined'
			) {
				const errorJson = JSON.stringify({
					message: 'file-buffer data is not founded!',
				})

				res.writeHead(500, this.headData.contentData)
				res.end(errorJson)

				return
			}

			try {
				await fs.writeFile(
					assetsPath(__dirname, `${pathAssets}/img/user/${userId}.png`),
					fileBody.fileBufferData
				)
				const jsonData = JSON.stringify({
					message: 'Profile has success upload!',
				})

				this.logger.info('File is success upload!')

				res.writeHead(201, this.headData.contentData)
				res.end(jsonData)

				return
			} catch (error) {
				const errorMessage =
					error instanceof Error ? error.message : 'File is not success upload!'
				const errorJson = { message: errorMessage }

				this.logger.error(errorMessage)

				res.writeHead(400, this.headData.contentData)
				res.end(errorJson)

				return
			}
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from upload-file profile!',
				this.logger
			)
		}
	}
}
