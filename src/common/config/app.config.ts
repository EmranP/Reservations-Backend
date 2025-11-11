export const APP_CONFIG = {
	PORT: Number(process.env.PORT),
	HOSTNAME: process.env.HOSTNAME,
	CLIENT_URL: process.env.CLIENT_URL,
	ADMIN_PASS: process.env.ADMIN_PASS,
} as const
