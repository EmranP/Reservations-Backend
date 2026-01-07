import type { IncomingMessage, ServerResponse } from 'http'
import type { Logger } from 'winston'
import { AuthBaseConfig } from '../auth/abstract/auth-config.base'
import type { IRequestUserApp } from '../auth/types/token.type'
import { responseInternalServer } from '../common/utils/app/errorResponse.utils'
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
}
