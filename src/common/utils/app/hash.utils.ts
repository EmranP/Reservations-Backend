import bcrypt from 'bcrypt'

export const hastToken = (token: string) => bcrypt.hash(token, 10)
