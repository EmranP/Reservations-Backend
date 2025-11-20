export const activationLinkHandler = (
	apiUrl: string,
	activeLink: string
): string => `${apiUrl}/api/auth/activate/${activeLink}`
