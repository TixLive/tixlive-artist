import Image from 'next/image';
import type { ISponsor } from '@/types';

interface SponsorsSectionProps {
	sponsors: ISponsor[];
}

export default function SponsorsSection({ sponsors }: SponsorsSectionProps) {
	if (!sponsors.length) return null;

	// Group sponsors by category
	const grouped = sponsors.reduce<Record<string, ISponsor[]>>((acc, sponsor) => {
		const cat = sponsor.category || 'Partners';
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
		<section className="mt-8">
			<h2 className="mb-4 font-[family-name:var(--font-display)] text-[1.5rem] font-semibold text-[var(--theme-text)]">
				Sponsors
			</h2>
			<div className="space-y-5">
				{sortedCategories.map((category) => (
					<div key={category}>
						<p className="mb-2 text-[0.6875rem] font-medium uppercase tracking-wider text-[var(--theme-text-muted)]">
							{category}
						</p>
						<div className="flex flex-wrap gap-3">
							{grouped[category].map((sponsor) => {
								const content = (
									<div
										key={sponsor.id}
										className="flex h-16 items-center justify-center rounded-lg border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] bg-[var(--theme-surface)] px-5 transition-colors hover:border-[color-mix(in_srgb,var(--theme-text)_20%,transparent)]"
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
											<span className="font-[family-name:var(--font-display)] text-[0.8125rem] font-medium text-[var(--theme-text)]">
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
		</section>
	);
}
