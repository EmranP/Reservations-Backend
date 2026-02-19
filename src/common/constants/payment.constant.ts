import { globalPrefixUrl } from './global.constant'

// Api-Backend
export const CREATE_PAYMENT = `${globalPrefixUrl}/payment/add`
export const GET_ALL_PAYMENT = `${globalPrefixUrl}/payments`
export const GET_ONE_PAYMENT = `${globalPrefixUrl}/payment`
export const CONFIRM_PAYMENT = `${globalPrefixUrl}/payment/confirm`
export const CANCEL_PAYMENT = `${globalPrefixUrl}/payment/cancel`
export const DELETE_PAYMENT = `${globalPrefixUrl}/payment/remove`
// Api-Backend with YooKassa
export const GET_ALL_FRESH_PAYMENT = `${globalPrefixUrl}/fresh/payments`
export const GET_ONE_FRESH_PAYMENT = `${globalPrefixUrl}/fresh/payment`

export const rootPaymentRouter = [CREATE_PAYMENT]

// Api-Backend YooKassa
export const API_PAYMENT_Y_KASSA = 'https://api.yookassa.ru/v3/payments'
