import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import SectionShell from '@/components/event/sections/SectionShell';
import type { IPackingItem } from '@/types';

interface PackingSectionProps {
	items: IPackingItem[];
}

function PackingCard({
	variant,
	title,
	items,
}: {
	variant: 'essential' | 'recommended';
	title: string;
	items: IPackingItem[];
}) {
	const isEssential = variant === 'essential';
	const accent = isEssential ? '#D97706' : 'var(--ink-3)';
	return (
		<div className="rounded-[18px] bg-[var(--surface)] p-5" style={{ boxShadow: 'var(--shadow-2)' }}>
			<div className="mb-3.5 flex items-center gap-2.5">
				<span
					className="flex h-7 w-7 items-center justify-center rounded-[9px]"
					style={{
						background: isEssential ? 'rgba(217, 119, 6, 0.12)' : 'var(--bg-2)',
						color: accent,
					}}
				>
					<Icon icon={isEssential ? 'mdi:alert-circle-outline' : 'mdi:plus-circle-outline'} width={14} />
				</span>
				<span className="text-[15px] font-[800] tracking-[-0.012em] text-[var(--ink)]">{title}</span>
			</div>
			<ul className="m-0 flex list-none flex-col gap-2.5 p-0">
				{items.map((item) => (
					<li
						key={item.id}
						className="flex items-start gap-2.5 text-[13.5px] leading-[1.45] text-[var(--ink-2)]"
					>
						<span
							className="mt-[5px] inline-block h-1.5 w-1.5 shrink-0 rounded-full"
							style={{ background: accent }}
						/>
						<span>{item.text}</span>
					</li>
				))}
			</ul>
		</div>
	);
}

export default function PackingSection({ items }: PackingSectionProps) {
	const { t } = useTranslation('common');
	if (!items.length) return null;
	const essential = items.filter((i) => i.type === 'essential');
	const recommended = items.filter((i) => i.type === 'recommended');

	return (
		<SectionShell label={t('sections.packing')}>
			<div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
				{essential.length > 0 && <PackingCard variant="essential" title={t('packing.essential')} items={essential} />}
				{recommended.length > 0 && (
					<PackingCard variant="recommended" title={t('packing.recommended')} items={recommended} />
				)}
			</div>
		</SectionShell>
	);
}
