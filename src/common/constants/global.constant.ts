export const globalPrefixUrl = '/api'
export const isPathWithQuery = (
	origin: string,
	route: string,
	params: string | undefined
) => `${origin}${globalPrefixUrl}/${route}${params ?? ''}`
