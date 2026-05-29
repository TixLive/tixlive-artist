import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { IEventPolicy } from '@/types';

interface PoliciesBlockProps {
	policies: IEventPolicy[];
}

export default function PoliciesBlock({ policies }: PoliciesBlockProps) {
	const { t } = useTranslation('common');
	if (!policies?.length) return null;

	return (
		<div className="mt-5 flex flex-col gap-2.5 rounded-[14px] bg-[var(--bg-2)] px-[18px] py-[14px]">
			<div className="flex items-center gap-2">
				<span className="inline-flex h-[22px] w-[22px] items-center justify-center rounded-[7px] bg-[var(--ink)] text-white">
					<Icon icon="mdi:shield-check-outline" width={11} />
				</span>
				<span className="text-[12.5px] font-[800] tracking-[-0.005em] text-[var(--ink)]">
					{t('event.access_terms')}
				</span>
			</div>
			<div
				className="grid gap-x-[18px] gap-y-2.5"
				style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
			>
				{policies.map((p) => (
					<div key={p.id} className="flex items-start gap-[9px]">
						<span className="mt-[7px] inline-block h-[5px] w-[5px] shrink-0 rounded-full bg-[var(--ink)]" />
						<div className="min-w-0 flex flex-col gap-px">
							<span className="text-[12.5px] font-[700] tracking-[-0.005em] text-[var(--ink)]">
								{p.title}
							</span>
							<span className="text-[12px] font-[500] leading-[1.45] text-[var(--ink-3)]">
								{p.body}
							</span>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
