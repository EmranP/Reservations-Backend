import {
	githubOAuthLogin,
	yandexOAuthLogin,
} from '../../constants/auth.constant'

export const generateTwoFactoryCode = () =>
	Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000

export const generateOAuthGoogleLink = (
	clientId: string | undefined,
	redirectUrl: string | undefined,
	state: string | undefined
): string => {
	const queryParams = {
		client_id: clientId,
		redirect_uri: redirectUrl,
		response_type: 'code',
		access_type: 'offline',
		scope: ['openid', 'profile', 'email'].join(' '),
		state,
	}

	const baseUrl = 'https://accounts.google.com/o/oauth2/v2/auth'

	const query = Object.entries(queryParams)
		.map(([key, value]) => value && `${key}=${encodeURIComponent(value)}`)
		.join('&')

	return `${baseUrl}?${query}`
}

export const generateOAuthGithubLink = (
	clientId: string | undefined,
	redirectUrl: string | undefined,
	state: string | undefined
): string => {
	const queryParams = {
		client_id: clientId,
		redirect_uri: redirectUrl,
		scope: ['user:email'],
		state,
	}

	const baseUrl = githubOAuthLogin
	const query = Object.entries(queryParams)
		.map(([key, value]) => `${key}=${value}`)
		.join('&')

	return `${baseUrl}?${query}`
}

export const generateOAuthYandexLink = (
	clientId: string | undefined,
	responseType: 'code',
	redirectUrl: string | undefined,
	state: string | undefined
): string => {
	const queryParams = {
		response_type: responseType,
		client_id: clientId,
		redirect_uri: redirectUrl,
		scope: ['login:email login:info login:avatar'],
		state,
	}

	const baseUrl = yandexOAuthLogin
	const query = Object.entries(queryParams)
		.map(([key, value]) => `${key}=${value}`)
		.join('&')

	console.log(`${baseUrl}?${query}`)

	return `${baseUrl}?${query}`
}
