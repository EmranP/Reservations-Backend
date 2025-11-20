export const APP_CONFIG = {
	PORT: Number(process.env.PORT),
	HOSTNAME: process.env.HOSTNAME,
	CLIENT_URL: process.env.CLIENT_URL,
	ADMIN_PASS: process.env.ADMIN_PASS,
	API_URL: process.env.API_URL,
	EXPIRES_USER_VERIFY: process.env.EXPIRES_USER_VERIFY,
} as const

export const EMAIL_CONFIG = {
	HOST: process.env.SMTP_HOST,
	PORT: Number(process.env.SMTP_PORT),
	USER: process.env.SMTP_USER,
	PASSWORD: process.env.SMTP_PASSWORD,
} as const
