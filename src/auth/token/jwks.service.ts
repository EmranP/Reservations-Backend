import fs from 'fs'
import { exportJWK, importSPKI } from 'jose'
import path from 'path'
import { v4 as uuidV4 } from 'uuid'

export const genJwks = async () => {
	const publicPem = fs.readFileSync(
		path.join(__dirname, '../../../public.pem'),
		'utf8'
	)
	const key = await importSPKI(publicPem, 'RS256')
	const jwk = await exportJWK(key)

	jwk.kid = jwk.kid || `kid-${uuidV4()}`
	jwk.use = 'sig'
	jwk.alg = 'RS256'

	const jwks = { keys: [jwk] }

	fs.writeFileSync('./jwks.json', JSON.stringify(jwks, null, 2))
}
