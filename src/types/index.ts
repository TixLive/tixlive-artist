import type { Section } from '@/lib/seatingGeometry';

export interface IOrganizer {
	id: number;
	name: string;
	slug: string;
	logo_url: string | null;
	brand_primary_color: string | null;
	brand_accent_color: string | null;
	bio: string | null;
	social_links: Record<string, string>;
	/** Legal/info pages with published content + the locales they exist in. */
	pages?: Array<{ page_type: string; locales: string[] }>;
}

/** A single legal/info page (HTML content per locale). */
export interface IOrganizerPage {
	page_type: string;
	content: Record<string, string>;
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
	remaining_capacity: number | null;
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
	remaining_capacity: number | null;
	max_tickets_per_user: number;
	/** For seated events: number of seats assigned to this tier. null for GA events. */
	total_seats?: number | null;
}

export interface IAvailablePaymentMethod {
	id: number;
	name: string;
	type: 'redirect' | 'card';
	logo_url: string | null;
	fee_percent: number;
}

// --- Page content sub-types (event-type-specific sections) ---

export interface IArtist {
	id: number;
	name: string;
	role: string | null;
	category: string | null;
	image_url: string | null;
	sort_order: number;
}

export interface ITeam {
	id: number;
	name: string;
	subtitle: string | null;
	logo_url: string | null;
	sort_order: number;
}

export interface ISpeaker {
	id: number;
	name: string;
	title: string | null;
	company: string | null;
	bio: string | null;
	image_url: string | null;
	sort_order: number;
}

export interface ISponsor {
	id: number;
	name: string;
	category: string | null;
	type: string | null;
	logo_url: string | null;
	website_url: string | null;
	sort_order: number;
}

export interface IAgendaItem {
	id: number;
	title: string;
	start_time: string | null;
	description: string | null;
	sort_order: number;
}

export interface IRule {
	id: number;
	type: 'allowed' | 'forbidden';
	text: string;
	sort_order: number;
}

export interface IFaq {
	id: number;
	question: string;
	answer: string;
	sort_order: number;
}

export interface ITravelRec {
	id: number;
	type: 'hotel' | 'restaurant' | 'flight' | 'transport' | 'other';
	name: string;
	address: string | null;
	price_range: string | null;
	url: string | null;
	description: string | null;
	sort_order: number;
}

export interface IPackingItem {
	id: number;
	type: 'essential' | 'recommended';
	text: string;
	sort_order: number;
}

export interface ITicketAddon {
	id: number;
	name: string;
	description: string | null;
	price: number;
	max_quantity: number | null;
	per_ticket: boolean;
	color: string | null;
	sort_order: number;
}

export interface IPageContent {
	lineup?: IArtist[];
	speakers?: ISpeaker[];
	program?: IAgendaItem[];
	teams?: ITeam[];
	sponsors?: ISponsor[];
	rules?: IRule[];
	faq?: IFaq[];
	travel?: ITravelRec[];
	packing?: IPackingItem[];
	video_url?: string;
	aftermovie_url?: string;
	dress_code_type?: string;
	dress_code_recommended?: string;
	dress_code_forbidden?: string;
	special_message?: string;
	camping_checkin?: string;
	camping_checkout?: string;
	camping_showers?: string;
	camping_electricity?: string;
}

export interface IEventDetail extends IEventListItem {
	description: string;
	/** Portrait 2:3 poster (movie-poster style). null when not uploaded. */
	poster_portrait_url?: string | null;
	google_place_id: string | null;
	sessions: IEventSession[];
	ticket_types: ITicketType[];
	available_payment_methods: IAvailablePaymentMethod[];
	ticket_addons?: ITicketAddon[];
	active_sections?: string[];
	page_content?: IPageContent;
	platform_fee_payer?: 'buyer' | 'organizer';
	provider_fee_payer?: 'buyer' | 'organizer';
	platform_fee_percent?: number;
	platform_fee_fixed?: number;
	/** True when the event sells assigned seats (has a seating chart). */
	is_seated?: boolean;
	/** FOMO/urgency display config — admin toggles on the event (besttix). */
	fomo_enabled?: boolean;
	fomo_live_viewers?: boolean;
	fomo_recent_sales?: boolean;
	fomo_countdown?: boolean;
	fomo_low_stock?: boolean;
}

export interface ICartItem {
	ticket_type_id: number;
	ticket_type_name: string;
	price: number;
	quantity: number;
	currency: string;
}

export interface IAddonCartItem {
	addon_id: number;
	addon_name: string;
	price: number;
	quantity: number;
	per_ticket: boolean;
	currency: string;
}

export interface IOrderBuyBody {
	session_id: number;
	payment_method_id: number;
	/** Required for guest checkout; omitted when authed (Bearer provides identity). */
	email?: string;
	first_name?: string;
	last_name?: string;
	phone?: string;
	cart: Array<{ ticket_package_id: number; quantity: number }>;
	addons?: Array<{ addon_id: number; quantity: number }>;
	promo_code?: string;
	locale: string;
	idempotency_key?: string;
	/** Seated events only: flat list of chosen seat IDs (length === total ticket count). */
	selected_seats?: string[];
}

export interface IOrderBuyResponse {
	payment_url: string;
	token: string;
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
	items: Array<{ name: string; quantity: number; price: number; seat_id?: string | null }>;
	total: number;
	currency: string;
	pdf_url: string | null;
	created_at?: string;
}

export interface IMe {
	email: string;
	first_name: string;
	last_name: string;
	phone: string;
}

export interface IMeUpdate {
	first_name: string;
	last_name: string;
	phone?: string;
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
	/** Seated events: raw seat id, e.g. "104-3-12" → sector 104, row 3, seat 12. */
	seat_id?: string | null;
}

export interface IAttendeeSession {
	email: string;
	organizer_id: number;
}

// --- Seating (assigned-seat events) ---

export interface ISeatingTier {
	ticket_package_id: number;
	name: string;
	price: number;
	color: string | null;
	seat_ids: string[];
}

/** Response of GET /api/public/seating/[slug]?session_id= (full hall payload). */
export interface ISeatingResponse {
	geometry_version: number;
	canvas_w: number;
	canvas_h: number;
	sections: Section[];
	tiers: ISeatingTier[];
	/** Seats taken for this session (sold + active holds; expired holds excluded). */
	booked: string[];
}

/** Response of POST /api/public/seating/[slug]/suggest (auto-pick nearby seats). */
export interface ISeatingSuggestResponse {
	items: Array<{ ticket_package_id: number; seat_ids: string[] }>;
	/** True when any tier got fewer seats than requested. */
	shortfall: boolean;
}
