export const validateEmailReg = (value: string): boolean => {
	const emailReg =
		/^[a-zA-Z0-9]{1,}([_\-.][a-zA-Z0-9])?@{1}(\w+[.]{1}){1,}[a-zA-Z]{2,}$/

	return emailReg.test(value)
}

export const validatePhoneReg = (value: string): boolean => {
	const phoneReg = /^([+]?[0-9\s-\(\)]{3,25})*$/i

	return phoneReg.test(value)
}

export const validatePassword = (value: string) => {
	let message: string | undefined
	const passReg = /^(?=.*[0-9])[a-zA-Z0-9!@#$%^&*]{6,16}$/

	if (value.length < 6) {
		message = 'Password is not valid: min-symbol 6'
	} else if (value.length > 16) {
		message = 'Password is not valid: max-symbol 16'
	}

	return {
		valid: passReg.test(value),
		message,
	}
}

export const validatePinCode = (value: number) => {
	let message: string | undefined

	if (value.toString().length !== 6) {
		message = 'Pin-code is not valid: that have 6 symbol'
	}

	return { message }
}
