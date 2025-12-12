import type { Pool } from 'pg'

export class ProfileModel {
	constructor(private pool: Pool) {}

	async getProfileMe(userId: string) {}

	async editProfile(userId: string, dto) {}

	async uploadProfileImage(userId: string, dto) {}

	async removeProfileImage(userId: string, dto) {}
}
