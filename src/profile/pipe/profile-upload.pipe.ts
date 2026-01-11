import type { IContextFiles } from '../../common/types/middlewares/app.types-middleware'

export const isUploadProfileDto = (
	obj: IContextFiles | undefined
): obj is IContextFiles => {
	const isCommonValidObj = typeof obj === 'object' && obj !== null

	if (!isCommonValidObj) return false
	const isValidFile = 'fileBufferData' in obj

	return isValidFile
}
