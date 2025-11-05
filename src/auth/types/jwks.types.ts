export interface IJwksKeysData {
	e: string
	kty: string
	n: string
	kid: string
	use: string
	alg: string
}

export interface IJwksMetaData {
	id: string
	private: boolean
	createAt: Date
}

export interface IResponseJwks {
	record: {
		keys: IJwksKeysData[]
	}
	metadata: IJwksMetaData
}
