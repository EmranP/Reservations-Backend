// Set Date
export const setDateUtil = (days: number): Date => {
	const now = new Date()

	const plusDays = new Date(now)

	plusDays.setDate(now.getDate() + days)

	return plusDays
}

export const setMinuteUtil = (minute: number): Date => {
	const now = new Date()

	const plusMinute = new Date(now)

	plusMinute.setMinutes(now.getMinutes() + minute)

	return plusMinute
}
