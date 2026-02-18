export const ROLES = {
	ADMIN: 0,
	CUSTOMER: 1,
} as const

export const STATUS_ROOM = {
	FREE: 'FREE',
	BUYS: 'BUYS',
} as const

export const STATUS_ORDER = {
	WAITING: 'payment.waiting_for_capture',
	PAYMENT_SUCCEEDED: 'payment.succeeded',
	PAYMENT_CANCELED: 'payment.canceled',
	PAYMENT_METHOD: 'payment_method.active',
	REFUND_SUCCEEDED: 'refund.succeeded',
	PAYOUT_SUCCEEDED: 'payout.succeeded',
	PAYOUT_CANCELED: 'payout.canceled',
	DEAL_CLOSED: 'deal.closed',
} as const
