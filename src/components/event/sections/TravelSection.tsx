import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import SectionShell from '@/components/event/sections/SectionShell';
import type { ITravelRec } from '@/types';

interface TravelSectionProps {
	recommendations: ITravelRec[];
}

const TYPE_ORDER = ['hotel', 'restaurant', 'flight', 'transport', 'other'] as const;

export default function TravelSection({ recommendations }: TravelSectionProps) {
	const { t } = useTranslation('common');

	const grouped = recommendations.reduce<Record<string, ITravelRec[]>>((acc, rec) => {
		(acc[rec.type] ??= []).push(rec);
		return acc;
	}, {});
	const presentTypes = TYPE_ORDER.filter((tp) => grouped[tp]?.length);

	const [tab, setTab] = useState<string>(presentTypes[0] ?? 'hotel');
	if (!recommendations.length || !presentTypes.length) return null;

	const items = grouped[tab] ?? [];

	return (
		<SectionShell label={t('sections.travel')} sub={t('sections.travel_sub')}>
			{/* Pill tabs with count */}
			<div className="mb-3.5 flex flex-wrap gap-2">
				{presentTypes.map((tp) => {
					const active = tab === tp;
					const count = grouped[tp]?.length ?? 0;
					return (
						<button
							key={tp}
							onClick={() => setTab(tp)}
							className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-[600] tracking-[-0.005em] transition-colors duration-150 ${
								active ? 'bg-[var(--ink)] text-white' : 'bg-[var(--bg-2)] text-[var(--ink)] hover:bg-[var(--bg-3)]'
							}`}
						>
							{t(`travel.${tp}`, { defaultValue: t('travel.other') })}
							<span
								className={`rounded-full px-[7px] py-[1px] text-[11px] font-[700] tabular-nums ${
									active ? 'bg-white/15 text-white' : 'bg-[var(--bg-3)] text-[var(--ink-2)]'
								}`}
							>
								{count}
							</span>
						</button>
					);
				})}
			</div>

			{/* Card grid */}
			<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
				{items.map((rec) => {
					const isLink = rec.url && /^https?:\/\//i.test(rec.url);
					const cardCls = 'flex flex-col gap-2 rounded-[16px] bg-[var(--surface)] p-[18px] transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-hover)]';
					const inner = (
						<>
							<div className="flex items-start justify-between gap-3">
								<span className="text-[16px] font-[800] tracking-[-0.018em] text-[var(--ink)]">{rec.name}</span>
								{isLink && <Icon icon="mdi:open-in-new" width={13} className="text-[var(--ink-3)]" />}
							</div>
							{rec.description && (
								<span className="text-[13px] leading-[1.5] text-[var(--ink-3)]">{rec.description}</span>
							)}
							{rec.address && (
								<span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ink-4)]">
									<Icon icon="mdi:map-marker-outline" width={11} />
									{rec.address}
								</span>
							)}
							{rec.price_range && (
								<span className="mt-1 self-start rounded-full bg-[var(--bg-2)] px-2.5 py-1 text-[11.5px] font-[700] tracking-[-0.005em] text-[var(--ink-2)]">
									{rec.price_range}
								</span>
							)}
						</>
					);
					return isLink ? (
						<a
							key={rec.id}
							href={rec.url!}
							target="_blank"
							rel="noopener noreferrer"
							className={cardCls}
							style={{ boxShadow: 'var(--shadow-2)' }}
						>
							{inner}
						</a>
					) : (
						<div key={rec.id} className={cardCls} style={{ boxShadow: 'var(--shadow-2)' }}>
							{inner}
						</div>
					);
				})}
			</div>
		</SectionShell>
	);
}
