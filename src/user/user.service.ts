import type { Logger } from 'winston'
import type { UserModel } from './user.model'

export class UserService {
	constructor(private model: UserModel, private logger: Logger) {}

	async findAllUser(limit: number = 10, offset: number = 0) {
		const allUser = await this.model.getAllUserModel()

		if (!allUser.length || allUser.length < 0) {
			return { message: 'Users not founded', status: 404 }
		}

		return {
			users: allUser,
		}
	}

	async findOneUser() {}

	async updateUser() {}

	async deleteUser(userId: string | null) {}
}
