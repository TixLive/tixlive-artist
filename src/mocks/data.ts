// MOCK DATA — delete this file before production. Used when USE_MOCKS=true

import type {
	IOrganizer,
	IEventListItem,
	IEventDetail,
	IOrderBuyResponse,
	IOrderDetail,
	ITicket,
	IPromoValidateResponse,
} from '@/types';

export const mockOrganizer: IOrganizer = {
	id: 1,
	name: 'TixLive Events',
	slug: 'tixlive-events',
	logo_url: null,
	brand_primary_color: '#8B5CF6',
	brand_accent_color: '#EC4899',
	bio: 'Premier event organizer bringing unforgettable live experiences to audiences worldwide.',
	social_links: {
		instagram: 'https://instagram.com/tixlive',
		facebook: 'https://facebook.com/tixlive',
		twitter: 'https://twitter.com/tixlive',
	},
};

export const mockEvents: IEventListItem[] = [
	{
		id: 1,
		slug: 'electric-summer-festival-2026',
		title: 'Electric Summer Festival 2026',
		poster_url: 'https://picsum.photos/seed/concert1/800/600',
		event_type: 'concert',
		status: 'open',
		venue_name: 'Chisinau Arena',
		venue_address: 'Str. Albisoara 38, Chisinau, Moldova',
		date_start: '2026-07-15T18:00:00Z',
		price_from: 350,
		currency: 'MDL',
		remaining_capacity: 1200,
	},
	{
		id: 2,
		slug: 'tech-connect-summit-2026',
		title: 'Tech Connect Summit 2026',
		poster_url: 'https://picsum.photos/seed/conf1/800/600',
		event_type: 'conference',
		status: 'open',
		venue_name: 'Moldexpo Exhibition Center',
		venue_address: 'Str. Ghioceilor 1, Chisinau, Moldova',
		date_start: '2026-09-20T09:00:00Z',
		price_from: 500,
		currency: 'MDL',
		remaining_capacity: 300,
	},
	{
		id: 3,
		slug: 'moldova-cup-finals-2026',
		title: 'Moldova Cup Finals 2026',
		poster_url: 'https://picsum.photos/seed/sports1/800/600',
		event_type: 'sports',
		status: 'open',
		venue_name: 'Zimbru Stadium',
		venue_address: 'Str. Tricolorului 39, Chisinau, Moldova',
		date_start: '2026-05-10T17:00:00Z',
		price_from: 150,
		currency: 'MDL',
		remaining_capacity: 4500,
	},
	{
		id: 4,
		slug: 'jazz-nights-chisinau',
		title: 'Jazz Nights Chisinau',
		poster_url: 'https://picsum.photos/seed/concert2/800/600',
		event_type: 'concert',
		status: 'soon',
		venue_name: 'Organ Hall',
		venue_address: 'Bd. Stefan cel Mare 81, Chisinau, Moldova',
		date_start: '2026-08-05T20:00:00Z',
		price_from: 250,
		currency: 'MDL',
		remaining_capacity: 400,
	},
	{
		id: 5,
		slug: 'startup-weekend-moldova',
		title: 'Startup Weekend Moldova',
		poster_url: 'https://picsum.photos/seed/conf2/800/600',
		event_type: 'conference',
		status: 'open',
		venue_name: 'Tekwill Center',
		venue_address: 'Str. Studentilor 9/7, Chisinau, Moldova',
		date_start: '2026-06-12T10:00:00Z',
		price_from: 200,
		currency: 'MDL',
		remaining_capacity: 80,
	},
	{
		id: 6,
		slug: 'rugby-championship-2025',
		title: 'Rugby Championship 2025',
		poster_url: 'https://picsum.photos/seed/sports2/800/600',
		event_type: 'sports',
		status: 'closed',
		venue_name: 'Zimbru Stadium',
		venue_address: 'Str. Tricolorului 39, Chisinau, Moldova',
		date_start: '2025-11-15T15:00:00Z',
		price_from: 100,
		currency: 'MDL',
		remaining_capacity: 0,
	},
];

export const mockEventDetail: IEventDetail = {
	id: 1,
	slug: 'electric-summer-festival-2026',
	title: 'Electric Summer Festival 2026',
	poster_url: 'https://picsum.photos/seed/concert1/800/600',
	event_type: 'concert',
	status: 'open',
	venue_name: 'Chisinau Arena',
	venue_address: 'Str. Albisoara 38, Chisinau, Moldova',
	date_start: '2026-07-15T18:00:00Z',
	price_from: 350,
	currency: 'MDL',
	remaining_capacity: 1200,
	description:
		'Experience the ultimate summer music festival! Three stages, 20+ artists, and an unforgettable night of electronic music under the stars. Food trucks, art installations, and VIP lounges available.',
	google_place_id: 'ChIJe7vKMf1wkEARXoL_vDkGFHo',
	sessions: [
		{
			id: 1,
			date: '2026-07-15T18:00:00Z',
			label: 'Day 1 — Friday',
		},
		{
			id: 2,
			date: '2026-07-16T18:00:00Z',
			label: 'Day 2 — Saturday',
		},
	],
	ticket_types: [
		{
			id: 1,
			name: 'General Admission',
			description: 'Access to all main stage performances',
			price: 350,
			currency: 'MDL',
			remaining_capacity: 800,
			max_tickets_per_user: 5,
		},
		{
			id: 2,
			name: 'VIP Pass',
			description: 'VIP area access, complimentary drinks, priority entry',
			price: 750,
			currency: 'MDL',
			remaining_capacity: 50,
			max_tickets_per_user: 4,
		},
		{
			id: 3,
			name: 'Backstage Experience',
			description: 'Meet & greet with artists, backstage tour, exclusive merch',
			price: 1500,
			currency: 'MDL',
			remaining_capacity: 0,
			max_tickets_per_user: 2,
		},
	],
	available_payment_methods: [
		{
			id: 6,
			name: 'MAIB',
			type: 'redirect',
			logo_url: null,
		},
		{
			id: 1,
			name: 'Runpay',
			type: 'card',
			logo_url: null,
		},
	],
};

export const mockOrderResponse: IOrderBuyResponse = {
	payment_url: 'https://maibmerchants.md/checkout/mock-session',
	order_id: 'mock-order-123',
};

export const mockOrderDetail: IOrderDetail = {
	id: 'mock-order-123',
	status: 'paid',
	event_title: 'Electric Summer Festival 2026',
	event_slug: 'electric-summer-festival-2026',
	session_date: '2026-07-15T18:00:00Z',
	items: [{ name: 'General Admission', quantity: 2, price: 350 }],
	total: 700,
	currency: 'MDL',
	pdf_url: null,
};

export const mockTickets: ITicket[] = [
	{
		id: 'ticket-001',
		event_title: 'Electric Summer Festival 2026',
		event_slug: 'electric-summer-festival-2026',
		session_date: '2026-07-15T18:00:00Z',
		ticket_type: 'General Admission',
		attendee_name: 'Ion Morosan',
		qr_code_data: 'TIXLIVE-TICKET-001-ESF2026-GA',
		pdf_url: null,
	},
	{
		id: 'ticket-002',
		event_title: 'Electric Summer Festival 2026',
		event_slug: 'electric-summer-festival-2026',
		session_date: '2026-07-15T18:00:00Z',
		ticket_type: 'General Admission',
		attendee_name: 'Ion Morosan',
		qr_code_data: 'TIXLIVE-TICKET-002-ESF2026-GA',
		pdf_url: null,
	},
];

export const mockPromoValid: IPromoValidateResponse = {
	valid: true,
	discount_percent: 10,
};

export const mockPromoInvalid: IPromoValidateResponse = {
	valid: false,
	error: 'Invalid promo code',
};
