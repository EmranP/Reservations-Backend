export const genLinks = (
	uuidV4: () => string
): {
	activationLink: string
	resetPassLink: string
} => ({
	activationLink: uuidV4(),
	resetPassLink: uuidV4(),
})

export const activationLinkHandler = (
	apiUrl: string,
	activeLink: string
): string => `${apiUrl}/api/auth/activate/${activeLink}`

export const resetPassLinkHandler = (
	apiUrl: string,
	resetLink: string
): string => `${apiUrl}/api/auth/forget/activate/${resetLink}`
