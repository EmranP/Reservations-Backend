import bcrypt from 'bcryptjs'

export const hastToken = (token: string) => bcrypt.hash(token, 10)
