import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { useOrganizer } from '@/contexts/OrganizerContext';

interface StickyCTABarProps {
	eyebrow: string;
	title: string;
	priceLabel: string;
	ctaLabel: string;
	onCta: () => void;
	disabled?: boolean;
}

/**
 * Global sticky CTA bar shown at the bottom of event pages on all viewports.
 * Reserves `body { padding-bottom }` so the page footer can scroll above it.
 */
export default function StickyCTABar({ eyebrow, title, priceLabel, ctaLabel, onCta, disabled }: StickyCTABarProps) {
	const { t } = useTranslation('common');
	const { organizer } = useOrganizer();
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const update = () => {
			document.body.style.paddingBottom = ref.current ? `${ref.current.offsetHeight}px` : '';
		};
		update();
		window.addEventListener('resize', update);
		return () => {
			window.removeEventListener('resize', update);
			document.body.style.paddingBottom = '';
		};
	}, []);

	return (
		<div
			ref={ref}
			className="sticky-cta-bar fixed inset-x-0 bottom-0 z-40 bg-[var(--ink)] text-white"
			style={{
				boxShadow: '0 -8px 28px -8px rgba(0,0,0,0.25)',
				paddingBottom: 'env(safe-area-inset-bottom)',
			}}
		>
			<style>{`
				.sticky-cta-bar .sticky-inner {
					padding-top: 14px;
					padding-bottom: 14px;
				}
				@media (max-width: 720px) {
					.sticky-cta-bar .sticky-inner { padding-top: 12px !important; padding-bottom: 12px !important; gap: 12px !important; }
					.sticky-cta-bar .sticky-cta-info { display: none !important; }
					.sticky-cta-bar .sticky-cta-title-wrap { display: none !important; }
					.sticky-cta-bar .sticky-cta-buy { padding: 12px 22px !important; font-size: 13.5px !important; }
				}
				@media (max-width: 420px) {
					.sticky-cta-bar .sticky-cta-logo { display: none !important; }
					.sticky-cta-bar .sticky-inner { justify-content: center !important; }
					.sticky-cta-bar .sticky-cta-buy { padding: 12px 28px !important; }
				}
			`}</style>
			<div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-5 md:px-8 sticky-inner">
				<div className="sticky-cta-logo flex min-w-0 items-center gap-[14px]">
					{organizer?.logo_url ? (
						<span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-1">
							<Image
								src={organizer.logo_url}
								alt={organizer.name}
								width={56}
								height={56}
								className="h-full w-full object-contain"
							/>
						</span>
					) : organizer ? (
						<span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[13px] font-[800] tracking-[-0.02em] text-[var(--ink)]">
							{organizer.name.charAt(0)}
						</span>
					) : null}
					<div className="sticky-cta-title-wrap flex min-w-0 flex-col leading-tight">
						<span className="text-[10.5px] font-[700] uppercase tracking-[0.12em] text-white/55">
							{eyebrow}
						</span>
						<span className="truncate text-[14px] font-[700] tracking-[-0.012em] text-white">
							{title}
						</span>
					</div>
				</div>

				<div className="sticky-cta-right flex shrink-0 items-center gap-[14px]">
					<div className="sticky-cta-info flex flex-col items-end leading-tight">
						<span className="text-[10px] font-[700] uppercase tracking-[0.12em] text-white/55">
							{t('event.tickets')}
						</span>
						<span className="text-[14.5px] font-[700] tracking-[-0.008em] text-white tabular-nums">
							{priceLabel}
						</span>
					</div>
					<button
						type="button"
						onClick={onCta}
						disabled={disabled}
						className="sticky-cta-buy inline-flex items-center gap-2 rounded-full bg-white px-6 py-[14px] text-[14.5px] font-[600] tracking-[-0.012em] text-[var(--ink)] transition-transform duration-150 enabled:hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
					>
						{ctaLabel}
						<Icon icon="mdi:arrow-right" width={13} />
					</button>
				</div>
			</div>
		</div>
	);
}
