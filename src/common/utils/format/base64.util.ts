export const base64UrlDecodeToString = (b64url: string) => {
	let s = b64url.replace(/-/g, '+').replace(/_/g, '/')
	const pad = s.length % 4

	if (pad === 2) s += '=='
	else if (pad === 3) s += '='
	else if (pad === 1) throw new Error('Invalid base64url string')

	return Buffer.from(s, 'base64').toString('utf8')
}
