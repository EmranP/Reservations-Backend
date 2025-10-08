import { importPKCS8 } from 'jose'
import { PRIVATE_PEM } from '../../config/jwks.config'

// ! Starting work with token service

export const getPrivateKey = () => {
	return importPKCS8(PRIVATE_PEM, 'RS256')
}
