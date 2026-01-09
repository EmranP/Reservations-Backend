export interface IJwksData {
	e: string
	kty: string
	n: string
	kid: string
	use: string
	alg: string
}

export interface IJwksKeysData {
	keys: IJwksData[]
}

export interface IJwksMetaData {
	id: string
	private: boolean
	createAt: Date
}

export interface IResponseJwks {
	record: IJwksKeysData
	metadata: IJwksMetaData
}
