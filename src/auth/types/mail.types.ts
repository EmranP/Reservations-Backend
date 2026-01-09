interface IEnvelope {
	from: string
	to: string[]
}

export interface IResponseEmail {
	accepted: string[]
	rejected: []
	ehlo: string[]
	envelopeTime: number
	messageTime: number
	messageSize: number
	response: string
	envelope: IEnvelope
	messageId: string
}
