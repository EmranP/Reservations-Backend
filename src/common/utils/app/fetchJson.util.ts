export const fetchJson = async <T>(
	url: string,
	options?: RequestInit
): Promise<T> => {
	const res = await fetch(url, options)

	if (!res.ok) {
		throw new Error(`Fetch failed: ${res.status}`)
	}

	return res.json() as Promise<T>
}
