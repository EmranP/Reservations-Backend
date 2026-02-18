import { globalPrefixUrl } from './global.constant'

// POST
export const ORDER_ADD = `${globalPrefixUrl}/order/add`
// GET
export const ORDERS_GET_ALL = `${globalPrefixUrl}/orders`
export const ORDER_GET_BY_ID = `${globalPrefixUrl}/order`
// EDIT
export const ORDER_UPDATE_BY_ID = `${globalPrefixUrl}/order/edit`
// DELETE
export const ORDER_REMOVE_BY_ID = `${globalPrefixUrl}/order/remove`

export const rootOrderRouter = [ORDER_ADD]
