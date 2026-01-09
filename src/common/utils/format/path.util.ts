import path from 'path'

export const assetsPath = (dirname: string, pathFile: string) =>
	path.join(dirname, `${pathFile}`)
