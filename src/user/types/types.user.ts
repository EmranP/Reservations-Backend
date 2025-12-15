import type { IUser } from '../../app/db/types/user.types'
import type { IAppService } from '../../common/types/app/app.type'

export interface IUserService extends IAppService {
	users: Omit<IUser, 'password' | 'activation_link'>[]
}
