export interface IOrganizer {
	id: number;
	name: string;
	slug: string;
	logo_url: string | null;
	brand_primary_color: string | null;
	brand_accent_color: string | null;
	bio: string | null;
	social_links: Record<string, string>;
}

export interface IEventListItem {
	id: number;
	slug: string;
	title: string;
	poster_url: string | null;
	event_type: string;
	status: 'draft' | 'soon' | 'open' | 'closed';
	venue_name: string;
	venue_address: string;
	date_start: string;
	price_from: number;
	currency: string;
	remaining_capacity: number;
}

export interface IEventSession {
	id: number;
	date: string;
	label: string;
}

export interface ITicketType {
	id: number;
	name: string;
	description: string | null;
	price: number;
	currency: string;
	remaining_capacity: number;
	max_tickets_per_user: number;
}

export interface IAvailablePaymentMethod {
	id: number;
	name: string;
	type: 'redirect' | 'card';
	logo_url: string | null;
}

export interface IEventDetail extends IEventListItem {
	description: string;
	google_place_id: string | null;
	sessions: IEventSession[];
	ticket_types: ITicketType[];
	available_payment_methods: IAvailablePaymentMethod[];
}

export interface ICartItem {
	ticket_type_id: number;
	ticket_type_name: string;
	price: number;
	quantity: number;
	currency: string;
}

export interface IOrderBuyBody {
	session_id: number;
	payment_method_id: number;
	email: string;
	first_name: string;
	last_name: string;
	phone?: string;
	cart: Array<{ ticket_package_id: number; quantity: number }>;
	promo_code?: string;
	locale: string;
}

export interface IOrderBuyResponse {
	payment_url: string;
	order_id: string;
}

export interface IPromoValidateResponse {
	valid: boolean;
	discount_percent?: number;
	discount_amount?: number;
	error?: string;
}

export interface IOrderDetail {
	id: string;
	status: 'pending' | 'paid' | 'failed';
	event_title: string;
	event_slug: string;
	session_date: string;
	items: Array<{ name: string; quantity: number; price: number }>;
	total: number;
	currency: string;
	pdf_url: string | null;
}

export interface ITicket {
	id: string;
	event_title: string;
	event_slug: string;
	session_date: string;
	ticket_type: string;
	attendee_name: string;
	qr_code_data: string;
	pdf_url: string | null;
}

export interface IAttendeeSession {
	email: string;
	organizer_id: number;
}
