import type { UserDto } from '../dto/user.dto'

export interface IAuthUserService {
	user: UserDto
	message: string
	status: number
}

export type TypeAuthUserService = Promise<Partial<IAuthUserService>>
