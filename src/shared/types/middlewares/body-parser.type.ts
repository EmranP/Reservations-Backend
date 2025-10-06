// export interface IContextBodyParser {
// 	auth:

// }

export type TypeContextBody<T> = T | { error: 'Invalid JSON' }
