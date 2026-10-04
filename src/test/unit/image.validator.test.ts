import { BaseConfig } from '../../common/abstract/base-config.common'

class TestConfig extends BaseConfig {}

describe('validateImageSize', () => {
	const config = new TestConfig()

	const logger = {
		warn: jest.fn(),
	} as any

	it('should return error if size too large', () => {
		const result = config['validateImageFile'](
			10_000_000,
			'jpeg',
			500,
			500,
			logger
		)

		expect(result).toEqual({ message: 'Image is too large!' })
		expect(logger.warn).toHaveBeenCalled()
	})
})
