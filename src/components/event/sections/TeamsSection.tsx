import Image from 'next/image';
import { Icon } from '@iconify/react';
import type { ITeam } from '@/types';

interface TeamsSectionProps {
	teams: ITeam[];
}

export default function TeamsSection({ teams }: TeamsSectionProps) {
	if (teams.length < 2) return null;

	const [teamA, teamB] = teams;

	return (
		<section className="mt-8">
			<h2 className="mb-4 font-[family-name:var(--font-display)] text-[1.5rem] font-semibold text-[var(--theme-text)]">
				Match
			</h2>
			<div className="flex items-center justify-center gap-4 rounded-xl bg-[var(--theme-surface)] p-6 sm:gap-8">
				{/* Team A */}
				<div className="flex flex-1 flex-col items-center text-center">
					{teamA.logo_url ? (
						<Image
							src={teamA.logo_url}
							alt={teamA.name}
							width={80}
							height={80}
							className="mb-3 rounded-full object-contain"
						/>
					) : (
						<div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand-primary)_15%,transparent)]">
							<Icon icon="mdi:shield" width={40} className="text-[var(--brand-primary)]" />
						</div>
					)}
					<p className="font-[family-name:var(--font-display)] text-[1.125rem] font-bold text-[var(--theme-text)]">
						{teamA.name}
					</p>
					{teamA.subtitle && (
						<p className="mt-0.5 text-[0.75rem] text-[var(--theme-text-muted)]">
							{teamA.subtitle}
						</p>
					)}
				</div>

				{/* VS divider */}
				<div className="flex flex-col items-center">
					<span className="font-[family-name:var(--font-display)] text-[1.5rem] font-black tracking-tight text-[var(--brand-primary)]">
						VS
					</span>
				</div>

				{/* Team B */}
				<div className="flex flex-1 flex-col items-center text-center">
					{teamB.logo_url ? (
						<Image
							src={teamB.logo_url}
							alt={teamB.name}
							width={80}
							height={80}
							className="mb-3 rounded-full object-contain"
						/>
					) : (
						<div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--brand-accent)_15%,transparent)]">
							<Icon icon="mdi:shield" width={40} className="text-[var(--brand-accent)]" />
						</div>
					)}
					<p className="font-[family-name:var(--font-display)] text-[1.125rem] font-bold text-[var(--theme-text)]">
						{teamB.name}
					</p>
					{teamB.subtitle && (
						<p className="mt-0.5 text-[0.75rem] text-[var(--theme-text-muted)]">
							{teamB.subtitle}
						</p>
					)}
				</div>
			</div>
		</section>
	);
}
