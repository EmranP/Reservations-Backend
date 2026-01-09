import type {
	AbstractConfigSetColors,
	AbstractConfigSetLevels,
} from 'winston/lib/winston/config'

export interface ICustomLogLevels {
	levels: AbstractConfigSetLevels
	colors: AbstractConfigSetColors
}
