import type { IContextFiles } from '../types/middlewares/app.types-middleware'

export const isUploadDto = (
	obj: IContextFiles | undefined
): obj is IContextFiles => {
	const isCommonValidObj = typeof obj === 'object' && obj !== null

	if (!isCommonValidObj) return false
	const isValidFile = 'fileBufferData' in obj

	return isValidFile
}
