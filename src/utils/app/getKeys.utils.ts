import { importPKCS8 } from 'jose'
import { PRIVATE_PEM } from '../../config/jwks.config'

export const getPrivateKey = () => {
	return importPKCS8(PRIVATE_PEM, 'RS256')
}
