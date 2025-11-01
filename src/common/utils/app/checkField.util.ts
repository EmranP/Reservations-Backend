export const checkValidDtoHandler = <T>(dto: T, fields: (keyof T)[]): boolean =>
	fields.some(key => !dto[key])
