import fs from 'fs/promises'
import type { Logger } from 'winston'

export const ensureDir = async (
	path: string,
	logger: Logger,
	label: string
): Promise<void> => {
	try {
		await fs.mkdir(path, { recursive: true })
		logger.info(`✅ ${label} folder is ready`)
	} catch (error) {
		logger.error(
			error instanceof Error ? error.message : `Failed to init ${label} folder`
		)
		throw error
	}
}
