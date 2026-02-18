import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger } from 'winston'
import type { IRequestUserApp } from '../auth/types/token.type'
import { BaseConfig } from '../common/abstract/base-config.common'
import type { IContextFiles } from '../common/types/middlewares/app.types-middleware'
import {
	responseBadRequest,
	responseInternalServer,
} from '../common/utils/app/errorResponse.utils'
import type { EditProfileDto } from './dto/edit-profile.dto'
import type { ProfileService } from './profile.service'

export class ProfileController extends BaseConfig {
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
				await responseBadRequest(
					updateUserProfile.message,
					res,
					updateUserProfile.status
				)

				return
			}

			const jsonData = JSON.stringify(updateUserProfile)

			res.writeHead(200, this.headData.contentData)
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

			const isDev = this.mode

			const resultUploadDB = await this.service.uploadProfileImage(
				userId,

				isDev,
				fileBody
			)

			if ('status' in resultUploadDB) {
				await responseBadRequest(
					resultUploadDB.message,
					res,
					resultUploadDB.status
				)

				return
			}

			const jsonData = JSON.stringify(resultUploadDB)

			this.logger.info(resultUploadDB.message)

			res.writeHead(201, this.headData.contentData)
			res.end(jsonData)
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from upload-file profile!',
				this.logger
			)
		}
	}

	async removeProfileImage(
		req: IRequestUserApp,
		res: ServerResponse<IncomingMessage>
	): Promise<void> {
		try {
			const userId = req.user?.sub
			const isDevMode = process.env.NODE_ENV
			const resultRemoveProfileImage = await this.service.removeProfileImage(
				userId,

				null,
				isDevMode
			)

			if ('status' in resultRemoveProfileImage) {
				await responseBadRequest(
					resultRemoveProfileImage.message,
					res,
					resultRemoveProfileImage.status
				)

				return
			}

			const jsonData = JSON.stringify(resultRemoveProfileImage)

			this.logger.info(resultRemoveProfileImage.message)

			res.writeHead(200, this.headData.contentData)
			res.end(jsonData)

			return
		} catch (error) {
			await responseInternalServer(
				error,
				res,
				'Internal-server from remove-file profile!',
				this.logger
			)
		}
	}
}
