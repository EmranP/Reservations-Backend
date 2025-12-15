import type { ProfileModel } from './profile.model'

export class ProfileService {
	constructor(private model: ProfileModel) {}

	async findOneProfile(userId: string) {}

	async editProfile(userId: string) {}

	async uploadProfile(userId: string) {}
}
