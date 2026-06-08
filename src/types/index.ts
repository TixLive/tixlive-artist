import type { Section } from '@/lib/seatingGeometry';

export interface IOrganizer {
	id: number;
	name: string;
	/** Registered legal entity name. Shown in the footer copyright line when present;
	 *  falls back to `name`. */
	legal_name?: string | null;
	slug: string;
	logo_url: string | null;
	/** White-label browser-tab icon (besttix favicon upload). */
	favicon_url: string | null;
	bio: string | null;
	social_links: Record<string, string>;
	/** Legal/info pages with published content + the locales they exist in. */
	pages?: Array<{ page_type: string; locales: string[] }>;
	/** Public Facebook Pixel id (company default). Browser pixel only — no token here. */
	facebook_pixel_id?: string | null;
	/** ISO 3166-1 alpha-2 country code of the organizer's company (e.g. 'RO').
	 *  Drives country-specific footer compliance marks (ANPC links). */
	country_code?: string | null;
	/** Names of the organizer's connected payment methods (e.g. ['MAIB', 'NETOPIA']).
	 *  Drives the accepted-payment marks shown in the footer. */
	payment_methods?: string[];
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
	/** 16:9 cover image (event.cover_image). Used as the wide banner. */
	poster_url: string | null;
	/** 2:3 portrait poster (event.poster_image). Drives the landing-hero split layout when present. */
	poster_portrait_url?: string | null;
	event_type: string;
	status: 'draft' | 'soon' | 'open' | 'closed';
	venue_name: string;
	venue_address: string;
	/** City label for the archive timeline meta + "orașe" stat. Optional until
	 *  the besttix list endpoint exposes it (see archive BE task list). */
	city?: string | null;
	date_start: string;
	/** IANA timezone of the event's (nearest) session, e.g. "Europe/Bucharest".
	 *  Format date_start in this zone so the time shown is always the venue's
	 *  local time, regardless of the viewer's location. See src/utils/datetime.ts. */
	timezone?: string;
	price_from: number;
	currency: string;
	remaining_capacity: number | null;
}

export interface IEventSession {
	id: number;
	date: string;
	label: string;
	/** IANA timezone for this session (e.g. "Europe/Bucharest"). */
	timezone?: string;
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

export interface IBundleItem {
	ticket_package_id: number | null;
	addon_id: number | null;
	quantity: number;
}

/** A fixed-price Pachet: buys a predefined set of tickets (+ add-ons) for one price. */
export interface IBundle {
	id: number;
	name: string;
	description: string | null;
	price: number;
	currency: string;
	/** Units left before sell-out; null when unlimited. */
	remaining_capacity: number | null;
	items: IBundleItem[];
}

export interface IAvailablePaymentMethod {
	id: number;
	name: string;
	type: 'redirect' | 'card';
	logo_url: string | null;
	fee_percent: number;
	fee_fixed: number;
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

export interface IEventPolicy {
	id: number;
	title: string;
	body: string;
	sort_order: number;
}

export interface IPageContent {
	lineup?: IArtist[];
	speakers?: ISpeaker[];
	program?: IAgendaItem[];
	teams?: ITeam[];
	sponsors?: ISponsor[];
	rules?: IRule[];
	policies?: IEventPolicy[];
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
	/** RO fiscal: cultural-stamp rate % added to the price + VAT rate (0 = fiscal off). */
	fiscal_stamp_rate?: number;
	fiscal_vat_rate?: number;
	/** True when the event sells assigned seats (has a seating chart). */
	is_seated?: boolean;
	/** Seated + category-purchase: the server auto-allocates seats, the buyer only
	 *  previews them (no seat-picking). Show a read-only preview, submit no selected_seats. */
	auto_allocate_seats?: boolean;
	/** Fixed-price bundles (Pachete). Absent/empty when the event has none. */
	bundles?: IBundle[];
	/** FOMO/urgency display config — admin toggles on the event (besttix). */
	fomo_enabled?: boolean;
	fomo_live_viewers?: boolean;
	fomo_recent_sales?: boolean;
	fomo_countdown?: boolean;
	fomo_low_stock?: boolean;
	/** Resolved public Facebook Pixel id (event override ?? company default). Browser pixel. */
	facebook_pixel_id?: string | null;
	/** Admin "on sale / accepts new orders" master switch (besttix). When false, sales are
	 *  closed regardless of status — disable the buy button and hide ticket selection.
	 *  Optional for backward-compat: a missing value is treated as on-sale. */
	is_on_sale?: boolean;
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
	/** Fixed-price bundles (Pachete). Server expands + auto-allocates seats. */
	bundles?: Array<{ bundle_id: number; quantity: number }>;
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
	/** IANA timezone of the session (e.g. "Europe/Bucharest"). Format session_date in this zone. */
	timezone?: string;
	items: Array<{ name: string; quantity: number; price: number; seat_id?: string | null }>;
	total: number;
	currency: string;
	/** Facebook-safe Purchase value/currency (besttix converts unsupported codes like MDL → USD). */
	pixel_value?: number;
	pixel_currency?: string;
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
	/** IANA timezone of the session (e.g. "Europe/Bucharest"). Format session_date in this zone. */
	timezone?: string;
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

/**
 * Generic envelope for paginated besttix list endpoints
 * (`/api/public/events`, `/api/public/orders`, `/api/public/tickets`).
 *
 * `next_offset` is `null` on the last page. Pass it back through
 * `useInfiniteQuery`'s `pageParam` to fetch the next page.
 */
export interface IPaginatedResponse<T> {
	data: T[];
	total: number;
	next_offset: number | null;
}

/**
 * Aggregate stats for the archive timeline header, computed over the organizer's full
 * past set on the backend (so the numbers are truthful without paging the whole archive).
 * year_min/year_max are null when the organizer has no finished events.
 */
export interface IArchiveStats {
	total_past: number;
	distinct_cities: number;
	year_min: number | null;
	year_max: number | null;
}
