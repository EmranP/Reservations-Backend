export const generateTwoFactoryCode = () =>
	Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000

export const generateOAuthGoogleLink = (
	clientId: string,
	redirectUrl: string
): string => {
	const queryParams = {
		client_id: clientId,
		redirect_uri: redirectUrl,
		response_type: 'code',
		access_type: 'offline',
		scope: ['openid', 'profile', 'email'].join(' '),
	}

	const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth'

	const query = Object.entries(queryParams)
		.map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
		.join('&')

	return `${baseUrl}?${query}`
}
