export class TokenGenerationError extends Error {
	status: number

	constructor() {
		super('Ошибка генерации токена')
		this.name = 'TokenGenerationError'
		this.status = 500
		Error.captureStackTrace(this, this.constructor)
	}
}

export class ApiError extends Error {
	status: number
	errors: Error[]

	constructor(status: number, message: string, errors: Error[] = []) {
		super(message)
		this.status = status
		this.errors = errors
		Error.captureStackTrace(this, this.constructor)
	}

	static InternalServer(): ApiError {
		return new ApiError(500, 'Internal Server Error')
	}

	static UnauthorizedError(): ApiError {
		return new ApiError(401, 'Пользователь не авторизован')
	}

	static BadRequest(message: string, errors: Error[] = []): ApiError {
		return new ApiError(400, message, errors)
	}

	static NotFound(message: string) {
		return new ApiError(404, message)
	}

	static Forbidden(message: string) {
		return new ApiError(403, message)
	}
}
