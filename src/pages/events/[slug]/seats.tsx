import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/i18n.config';

import SeatSelection from '@/components/seating/SeatSelection';
import { getSite, getEvent, getSeating, suggestSeats } from '@/lib/api';
import type { ICartItem, IAddonCartItem, ISeatingResponse } from '@/types';

interface SeatsPageProps {
	slug: string;
	eventTitle: string;
	venueName: string;
	venueAddress: string;
	sessionId: number;
	sessionDate: string;
	sessionStart: string;
	maxPerCategory: number;
	seedCart: Array<{ ticket_package_id: number; quantity: number }>;
	addonCart: IAddonCartItem[];
	seating: ISeatingResponse;
	initialSelectedSeatIds: string[];
	initialShortfall: boolean;
	currency: string;
}

export default function SeatsPage({
	slug,
	eventTitle,
	venueName,
	venueAddress,
	sessionId,
	sessionDate,
	sessionStart,
	maxPerCategory,
	seedCart,
	addonCart,
	seating,
	initialSelectedSeatIds,
	initialShortfall,
	currency,
}: SeatsPageProps) {
	return (
		<>
			<Head>
				<title>{`Alege locul — ${eventTitle}`}</title>
				<meta name="robots" content="noindex" />
				<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
			</Head>
			<SeatSelection
				slug={slug}
				sessionId={sessionId}
				sessionDate={sessionDate}
				sessionStart={sessionStart}
				eventTitle={eventTitle}
				venueName={venueName}
				venueAddress={venueAddress}
				maxPerCategory={maxPerCategory}
				seedCart={seedCart}
				addonCart={addonCart}
				seating={seating}
				initialSelectedSeatIds={initialSelectedSeatIds}
				initialShortfall={initialShortfall}
				currency={currency}
			/>
		</>
	);
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
	const { req, params, query, locale } = ctx;
	const slug = params?.slug as string;
	const eventUrl = `/events/${slug}`;

	try {
		let sessionRaw: string | undefined;
		let cartJson: string | undefined;
		let addonsJson: string | undefined;

		if (req.method === 'POST') {
			const chunks: Buffer[] = [];
			for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
			const p = new URLSearchParams(Buffer.concat(chunks).toString());
			sessionRaw = p.get('session') ?? undefined;
			cartJson = p.get('cart') ?? undefined;
			addonsJson = p.get('addons') ?? undefined;
		} else {
			sessionRaw = query.session as string;
			cartJson = query.cart as string;
			addonsJson = query.addons as string;
		}

		const [organizer, event] = await Promise.all([getSite(), getEvent(slug)]);

		if (!event || !event.is_seated || event.status !== 'open') {
			return { redirect: { destination: eventUrl, permanent: false } };
		}

		let seedCart: Array<{ ticket_package_id: number; quantity: number }> = [];
		try {
			const parsed: ICartItem[] = cartJson ? JSON.parse(cartJson) : [];
			seedCart = (Array.isArray(parsed) ? parsed : [])
				.filter((c) => c && c.quantity > 0)
				.map((c) => ({ ticket_package_id: c.ticket_type_id, quantity: c.quantity }));
		} catch {
			seedCart = [];
		}
		const seedCurrency = (() => {
			try {
				const parsed: ICartItem[] = cartJson ? JSON.parse(cartJson) : [];
				return Array.isArray(parsed) ? parsed[0]?.currency : undefined;
			} catch {
				return undefined;
			}
		})();

		let addonCart: IAddonCartItem[] = [];
		if (addonsJson) {
			try {
				addonCart = JSON.parse(addonsJson);
			} catch {
				addonCart = [];
			}
		}

		const matched = sessionRaw ? event.sessions?.find((s) => String(s.id) === sessionRaw) : undefined;
		const session = matched ?? (sessionRaw ? undefined : event.sessions?.[0]);
		if (!session) {
			return { redirect: { destination: eventUrl, permanent: false } };
		}
		const sessionId = session.id;

		const seating = await getSeating(slug, sessionId);

		let initialSelectedSeatIds: string[] = [];
		let initialShortfall = false;
		if (seedCart.length > 0) {
			try {
				const suggestion = await suggestSeats(slug, sessionId, seedCart);
				initialSelectedSeatIds = suggestion.items.flatMap((i) => i.seat_ids);
				initialShortfall = suggestion.shortfall;
			} catch {
				initialSelectedSeatIds = [];
				initialShortfall = false;
			}
		}

		const currency = seedCurrency ?? event.currency ?? 'MDL';
		const maxPerCategory = event.ticket_types?.[0]?.max_tickets_per_user ?? 10;

		return {
			props: {
				organizer,
				slug,
				eventTitle: event.title,
				venueName: event.venue_name ?? '',
				venueAddress: event.venue_address ?? '',
				sessionId,
				sessionDate: session?.label ?? '',
				sessionStart: session?.date ?? event.date_start ?? '',
				maxPerCategory,
				seedCart,
				addonCart,
				seating,
				initialSelectedSeatIds,
				initialShortfall,
				currency,
				brandPrimary: organizer.brand_primary_color || '',
				brandAccent: organizer.brand_accent_color || '',
				eventType: event.event_type || '',
				...(await serverSideTranslations(locale ?? 'en', ['common'], nextI18NextConfig)),
			},
		};
	} catch (error) {
		console.error('Seats getServerSideProps error:', error);
		return { redirect: { destination: eventUrl, permanent: false } };
	}
};
