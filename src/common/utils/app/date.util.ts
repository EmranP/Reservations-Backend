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

export const setHoursUtil = (hours: number): Date => {
	const now = new Date()

	const plusHours = new Date(now)

	plusHours.setHours(now.getMinutes() + hours)

	return plusHours
}

export const setSecundUtil = (sec: number): Date => {
	const now = new Date()

	const plusSecund = new Date(now)

	plusSecund.setSeconds(now.getSeconds() + sec)

	return plusSecund
}
