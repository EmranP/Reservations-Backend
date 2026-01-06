import type { ProfileService } from './profile.service'

export class ProfileController {
	constructor(private service: ProfileService) {}
}
