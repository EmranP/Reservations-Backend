import path from 'path'
import {
	addColors,
	createLogger,
	format,
	Logform as LogForm,
	transports,
} from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import type { ICustomLogLevels } from '../../types/config/log.interface'

const customLevels: ICustomLogLevels = {
	levels: {
		error: 0,
		warn: 1,
		info: 2,
		http: 3,
		debug: 4,
	},
	colors: {
		error: 'red',
		warn: 'yellow',
		info: 'blue',
		http: 'green',
		debug: 'cyan',
	},
}

type LogLevel = keyof typeof customLevels.levels

const level: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug'

const logFormat = format.combine(
	format.colorize({ all: true }),
	format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	format.printf(
		({ timestamp, level, message }: LogForm.TransformableInfo) =>
			`[${timestamp}] ${level}: ${message}`
	)
)

addColors(customLevels.colors)

export const logger = createLogger({
	level: level,
	levels: customLevels.levels,
	transports: [
		new transports.Console({
			format: logFormat,
		}),
		new DailyRotateFile({
			filename: path.join(__dirname, '../../../logs/error', 'error-%DATE%.log'),
			datePattern: 'YYYY-MM-DD',
			level: 'error',
			maxFiles: '14d',
		}),
		new DailyRotateFile({
			filename: path.join(__dirname, '../../../logs/warn', 'warn-%DATE%.log'),
			datePattern: 'YYYY-MM-DD',
			level: 'warn',
			maxFiles: '14d',
		}),
		new DailyRotateFile({
			filename: path.join(__dirname, '../../../logs/info', 'info-%DATE%.log'),
			datePattern: 'YYYY-MM-DD',
			level: 'info',
			maxFiles: '14d',
		}),
		new DailyRotateFile({
			filename: path.join(__dirname, '../../../logs/http', 'http-%DATE%.log'),
			datePattern: 'YYYY-MM-DD',
			level: 'http',
			maxFiles: '14d',
		}),
	],
})
