import type { STATUS_ORDER } from '../../app/enums'
import type { IAppSharedDto } from '../../common/types/app/app.type'

export interface IOrderDto extends IAppSharedDto {
	userId: string
	roomId: string
	totalPrice: number
	status: typeof STATUS_ORDER
	residenceTime: Date
}
