import { EditProfileDto } from '../../../profile/dto/edit-profile.dto'

export class AdminUserEditDto extends EditProfileDto {
	email: string | undefined
	role: number | undefined
	isVerify: boolean | undefined
	password: string | undefined
	method: string | undefined
}
