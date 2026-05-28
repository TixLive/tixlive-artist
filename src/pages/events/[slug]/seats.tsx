import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';

import SeatSelection from '@/components/seating/SeatSelection';
import { fetchEvent } from '@/queries/events/useGetEvent';
import { fetchSeating } from '@/queries/seating/useGetSeating';
import { suggestSeats } from '@/queries/seating/useSuggestSeats';
import type { ICartItem, IAddonCartItem, ISeatingResponse } from '@/types';

interface SeatsState {
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

export default function SeatsPage() {
	const { t } = useTranslation('common');
	const router = useRouter();
	// Static export: router.query.slug is '_' (shell placeholder); read real slug from URL
	const [slug, setSlug] = useState<string | undefined>(undefined);
	const [state, setState] = useState<SeatsState | null>(null);
	const [notFound, setNotFound] = useState(false);

	useEffect(() => {
		const q = router.query.slug as string | undefined;
		if (q && q !== '_') { setSlug(q); return; }
		const parts = window.location.pathname.split('/').filter(Boolean);
		setSlug(parts[1] ? decodeURIComponent(parts[1]) : undefined); // /events/:slug/seats
	}, [router.query.slug]);

	useEffect(() => {
		if (!slug) return;

		const raw = sessionStorage.getItem('tixlive:seats');
		if (!raw) {
			router.replace(`/events/${slug}`);
			return;
		}

		let stored: Record<string, string>;
		try {
			stored = JSON.parse(raw);
		} catch {
			router.replace(`/events/${slug}`);
			return;
		}

		const sessionRaw = stored.session;
		let seedCart: Array<{ ticket_package_id: number; quantity: number }> = [];
		let addonCart: IAddonCartItem[] = [];
		let seedCurrency: string | undefined;

		try {
			const parsed: ICartItem[] = stored.cart ? JSON.parse(stored.cart) : [];
			seedCart = (Array.isArray(parsed) ? parsed : [])
				.filter((c) => c && c.quantity > 0)
				.map((c) => ({ ticket_package_id: c.ticket_type_id, quantity: c.quantity }));
			seedCurrency = Array.isArray(parsed) ? parsed[0]?.currency : undefined;
		} catch {
			seedCart = [];
		}

		if (stored.addons) {
			try { addonCart = JSON.parse(stored.addons); } catch { addonCart = []; }
		}

		(async () => {
			try {
				const event = await fetchEvent(slug);
				if (!event || !event.is_seated || event.status !== 'open') {
					router.replace(`/events/${slug}`);
					return;
				}

				const matched = sessionRaw ? event.sessions?.find((s) => String(s.id) === sessionRaw) : undefined;
				const session = matched ?? event.sessions?.[0];
				if (!session) {
					router.replace(`/events/${slug}`);
					return;
				}

				const seating = await fetchSeating(slug, session.id);

				let initialSelectedSeatIds: string[] = [];
				let initialShortfall = false;
				if (seedCart.length > 0) {
					try {
						const suggestion = await suggestSeats(slug, session.id, seedCart);
						initialSelectedSeatIds = suggestion.items.flatMap((i) => i.seat_ids);
						initialShortfall = suggestion.shortfall;
					} catch {
						initialSelectedSeatIds = [];
						initialShortfall = false;
					}
				}

				const currency = seedCurrency ?? event.currency ?? 'MDL';
				const maxPerCategory = event.ticket_types?.[0]?.max_tickets_per_user ?? 10;

				setState({
					slug,
					eventTitle: event.title,
					venueName: event.venue_name ?? '',
					venueAddress: event.venue_address ?? '',
					sessionId: session.id,
					sessionDate: session.label ?? '',
					sessionStart: session.date ?? event.date_start ?? '',
					maxPerCategory,
					seedCart,
					addonCart,
					seating,
					initialSelectedSeatIds,
					initialShortfall,
					currency,
				});
			} catch {
				setNotFound(true);
			}
		})();
	}, [slug]); // eslint-disable-line react-hooks/exhaustive-deps

	if (notFound) return null;
	if (!state) return null;

	return (
		<>
			<Head>
				<title>{t('seating.page_title', { event: state.eventTitle })}</title>
				<meta name="robots" content="noindex" />
				<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
			</Head>
			<SeatSelection
				slug={state.slug}
				sessionId={state.sessionId}
				sessionDate={state.sessionDate}
				sessionStart={state.sessionStart}
				eventTitle={state.eventTitle}
				venueName={state.venueName}
				venueAddress={state.venueAddress}
				maxPerCategory={state.maxPerCategory}
				seedCart={state.seedCart}
				addonCart={state.addonCart}
				seating={state.seating}
				initialSelectedSeatIds={state.initialSelectedSeatIds}
				initialShortfall={state.initialShortfall}
				currency={state.currency}
			/>
		</>
	);
}

import { staticI18nProps } from '@/lib/staticI18n';

export async function getStaticPaths() {
	return { paths: [{ params: { slug: '_' } }], fallback: false };
}

export function getStaticProps() {
	return { props: staticI18nProps() };
}
