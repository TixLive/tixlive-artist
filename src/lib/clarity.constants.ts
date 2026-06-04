// Single source of truth for Microsoft Clarity event names, session-tag keys, and tag values.
// The besttix dashboard funnels/filters key off these exact strings, so they're a cross-repo
// contract — centralising them here keeps the frontend from drifting on a typo. SDK-free on
// purpose, so importing a constant never pulls in `@microsoft/clarity`.

/** Named funnel moments. Fired via the Clarity helper / `useClarityEventOnce`. */
export const CLARITY_EVENTS = {
	EVENT_VIEWED: 'event_viewed',
	SEATS_SELECTED: 'seats_selected',
	PROMO_APPLIED: 'promo_applied',
	PROMO_REJECTED: 'promo_rejected',
	CHECKOUT_STARTED: 'checkout_started',
	ORDER_INITIATED: 'order_initiated',
	ORDER_FAILED: 'order_failed',
	PURCHASE: 'purchase',
	PAYMENT_FAILED: 'payment_failed',
	LOGIN_CODE_SENT: 'login_code_sent',
	LOGIN_SUCCESS: 'login_success',
	LOGIN_FAILED: 'login_failed',
	TICKETS_VIEWED: 'tickets_viewed',
} as const;

export type ClarityEvent = (typeof CLARITY_EVENTS)[keyof typeof CLARITY_EVENTS];

/** Session-tag keys (filterable dimensions in the Clarity dashboard). */
export const CLARITY_TAGS = {
	HOSTNAME: 'hostname',
	ORGANIZER: 'organizer',
	AUTH_STATE: 'auth_state',
	PAYMENT_METHOD: 'payment_method',
} as const;

export type ClarityTag = (typeof CLARITY_TAGS)[keyof typeof CLARITY_TAGS];

/** Values for the `auth_state` tag. */
export const CLARITY_AUTH_STATE = {
	AUTHED: 'authed',
	GUEST: 'guest',
} as const;
