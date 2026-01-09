import crypto from 'crypto'
import type { IAppEnCrypto } from '../../types/app/app.type'

const ALGO = 'aes-256-gcm'
const KEY = Buffer.from(process.env.TOKEN_ENCRYPT_KEY!, 'hex')

export function encrypt(data: string): IAppEnCrypto {
	const iv = crypto.randomBytes(12)
	const cipher = crypto.createCipheriv(ALGO, KEY, iv)
	const encrypted = Buffer.concat([cipher.update(data, 'utf8'), cipher.final()])

	const tag = cipher.getAuthTag()

	return {
		encrypted: encrypted.toString('hex'),
		iv: iv.toString('hex'),
		tag: tag.toString('hex'),
	}
}

export function decrypt(encrypted: string, iv: string, tag: string): string {
	const decipher = crypto.createDecipheriv(ALGO, KEY, Buffer.from(iv, 'hex'))

	decipher.setAuthTag(Buffer.from(tag, 'hex'))

	const decrypted = Buffer.concat([
		decipher.update(Buffer.from(encrypted, 'hex')),
		decipher.final(),
	])

	return decrypted.toString('utf8')
}
