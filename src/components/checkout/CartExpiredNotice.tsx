import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';

interface CartExpiredNoticeProps {
	/** `expired` — the parked cart aged out (410); `missing` — no such link for this site (404). */
	kind: 'expired' | 'missing';
	/** Event the cart belonged to, when the url carried it — lets the buyer rebuild it in one tap. */
	eventSlug: string | null;
}

/**
 * Shown when `/checkout?session=<uuid>` can't be resumed. The two cases are kept apart on
 * purpose: an expired cart is the buyer's own, just stale ("pick again"), while an unknown
 * link is not something they can fix by retrying.
 */
export default function CartExpiredNotice({ kind, eventSlug }: CartExpiredNoticeProps) {
	const { t } = useTranslation('common');
	const href = eventSlug ? `/events/${eventSlug}` : '/';

	return (
		<div className="mx-auto max-w-[560px] px-4 pb-16 pt-16 text-center sm:px-5">
			<div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-2)]">
				<Icon icon={kind === 'expired' ? 'mdi:timer-sand-empty' : 'mdi:link-variant-off'} width={22} className="text-[var(--ink-3)]" />
			</div>
			<h1 className="m-0 text-[24px] font-[800] tracking-[-0.028em] text-[var(--ink)] sm:text-[28px]">
				{kind === 'expired' ? t('checkout.cart_expired_title') : t('checkout.cart_missing_title')}
			</h1>
			<p className="mx-auto mt-2.5 max-w-[420px] text-[14px] leading-[1.5] text-[var(--ink-3)]">
				{kind === 'expired' ? t('checkout.cart_expired_body') : t('checkout.cart_missing_body')}
			</p>
			<Link
				href={href}
				className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-6 py-[15px] text-[14px] font-[600] tracking-[-0.012em] text-white transition-colors duration-150 hover:bg-[var(--ink-2)]"
			>
				{eventSlug ? t('checkout.cart_restart_cta') : t('checkout.cart_browse_cta')}
				<Icon icon="mdi:arrow-right" width={14} />
			</Link>
		</div>
	);
}
