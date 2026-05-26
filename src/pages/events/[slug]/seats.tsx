import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import SeatSelection from '@/components/seating/SeatSelection';
import { directGetEvent, directGetSeating, directSuggestSeats } from '@/lib/directApi';
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
	const router = useRouter();
	const slug = router.query.slug as string | undefined;
	const [state, setState] = useState<SeatsState | null>(null);
	const [notFound, setNotFound] = useState(false);

	useEffect(() => {
		if (!router.isReady || !slug) return;

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
				const event = await directGetEvent(slug);
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

				const seating = await directGetSeating(slug, session.id);

				let initialSelectedSeatIds: string[] = [];
				let initialShortfall = false;
				if (seedCart.length > 0) {
					try {
						const suggestion = await directSuggestSeats(slug, session.id, seedCart);
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
	}, [router.isReady, slug]); // eslint-disable-line react-hooks/exhaustive-deps

	if (notFound) return null;
	if (!state) return null;

	return (
		<>
			<Head>
				<title>{`Alege locul — ${state.eventTitle}`}</title>
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

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/i18n.config';

export const getStaticPaths = () => ({ paths: [], fallback: true });
export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: await serverSideTranslations(locale ?? 'ro', ['common'], nextI18NextConfig),
  revalidate: 60,
});