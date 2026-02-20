import type { ROLES } from '../../../app/enums'
import type { AUTH_METHOD } from '../../../common/constants/enum.constant'
import type { IAppSharedDto } from '../../../common/types/app/app.type'

export interface IUserDto extends IAppSharedDto {
	firstName: string
	lastName: string | null
	email: string
	phone: string
	picture: string | null
	role: typeof ROLES | number
	isVerify: boolean
	resetPassLink: string | undefined
	enableResetPass: boolean
	enableTwoFactoryChallenge: boolean
}

export interface IAdminUserDto
	extends Omit<IUserDto, 'enableResetPass' | 'enableTwoFactoryChallenge'> {
	method: typeof AUTH_METHOD
}
