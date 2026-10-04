import { type Config } from 'jest'

const config: Config = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>/src'],
	moduleFileExtensions: ['ts', 'js'],
	testMatch: ['**/*.test.ts'],
	clearMocks: true,
	collectCoverage: true,
	coverageDirectory: 'coverage',
}

export default config
