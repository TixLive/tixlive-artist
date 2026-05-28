import Image from 'next/image';
import { useTranslation } from 'next-i18next';
import type { ISponsor } from '@/types';
import SectionShell from '@/components/event/sections/SectionShell';

interface SponsorsSectionProps {
	sponsors: ISponsor[];
}

export default function SponsorsSection({ sponsors }: SponsorsSectionProps) {
	const { t } = useTranslation('common');
	if (!sponsors.length) return null;

	const partnersLabel = t('sponsors.partners');

	// Group sponsors by category
	const grouped = sponsors.reduce<Record<string, ISponsor[]>>((acc, sponsor) => {
		const cat = sponsor.category || partnersLabel;
		if (!acc[cat]) acc[cat] = [];
		acc[cat].push(sponsor);
		return acc;
	}, {});

	// Sort tiers: Platinum > Gold > Silver > others
	const tierOrder = ['Platinum', 'Gold', 'Silver'];
	const sortedCategories = Object.keys(grouped).sort((a, b) => {
		const ai = tierOrder.indexOf(a);
		const bi = tierOrder.indexOf(b);
		if (ai !== -1 && bi !== -1) return ai - bi;
		if (ai !== -1) return -1;
		if (bi !== -1) return 1;
		return a.localeCompare(b);
	});

	return (
		<SectionShell label={t('sections.sponsors')}>
			<div className="space-y-7">
				{sortedCategories.map((category) => (
					<div key={category}>
						<p className="mb-3 text-center font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[color-mix(in_srgb,var(--theme-text)_45%,transparent)]">
							{category}
						</p>
						<div className="flex flex-wrap justify-center gap-3">
							{grouped[category].map((sponsor) => {
								const content = (
									<div
										key={sponsor.id}
										className="flex h-16 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] px-6 transition-colors hover:border-[color-mix(in_srgb,var(--theme-text)_18%,transparent)]"
									>
										{sponsor.logo_url ? (
											<Image
												src={sponsor.logo_url}
												alt={sponsor.name}
												width={120}
												height={40}
												className="max-h-10 w-auto object-contain"
											/>
										) : (
											<span className="font-[family-name:var(--font-display)] text-[0.875rem] font-[700] text-[var(--theme-text)]">
												{sponsor.name}
											</span>
										)}
									</div>
								);

								if (sponsor.website_url && /^https?:\/\//i.test(sponsor.website_url)) {
									return (
										<a
											key={sponsor.id}
											href={sponsor.website_url}
											target="_blank"
											rel="noopener noreferrer"
											className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]"
										>
											{content}
										</a>
									);
								}
								return <div key={sponsor.id}>{content}</div>;
							})}
						</div>
					</div>
				))}
			</div>
		</SectionShell>
	);
}
