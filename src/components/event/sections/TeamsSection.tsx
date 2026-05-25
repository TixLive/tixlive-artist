import Image from 'next/image';
import { Icon } from '@iconify/react';
import type { ITeam } from '@/types';
import SectionShell from '@/components/event/sections/SectionShell';

interface TeamsSectionProps {
	teams: ITeam[];
}

export default function TeamsSection({ teams }: TeamsSectionProps) {
	if (teams.length < 2) return null;

	const [teamA, teamB] = teams;

	return (
		<SectionShell label="Match">
			<div className="flex items-center justify-center gap-4 rounded-[22px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-7 shadow-[0_1px_2px_rgba(20,19,18,0.04),0_8px_24px_rgba(20,19,18,0.06)] sm:gap-8">
				{/* Team A */}
				<div className="flex flex-1 flex-col items-center text-center">
					{teamA.logo_url ? (
						<Image
							src={teamA.logo_url}
							alt={teamA.name}
							width={88}
							height={88}
							className="mb-3 h-[88px] w-[88px] rounded-full object-contain"
						/>
					) : (
						<div className="mb-3 flex h-[88px] w-[88px] items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--brand-accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--brand-accent)_6%,transparent)]">
							<Icon icon="mdi:shield" width={40} className="text-[var(--brand-accent)]" />
						</div>
					)}
					<p className="font-[family-name:var(--font-display)] text-[1.125rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
						{teamA.name}
					</p>
					{teamA.subtitle && (
						<p className="mt-0.5 text-[0.8125rem] text-[var(--theme-text-muted)]">
							{teamA.subtitle}
						</p>
					)}
				</div>

				{/* VS divider */}
				<div className="flex flex-col items-center">
					<span className="font-[family-name:var(--font-display)] text-[2rem] font-[700] tracking-[-0.03em] text-[var(--brand-accent)] sm:text-[2.5rem]">
						VS
					</span>
				</div>

				{/* Team B */}
				<div className="flex flex-1 flex-col items-center text-center">
					{teamB.logo_url ? (
						<Image
							src={teamB.logo_url}
							alt={teamB.name}
							width={88}
							height={88}
							className="mb-3 h-[88px] w-[88px] rounded-full object-contain"
						/>
					) : (
						<div className="mb-3 flex h-[88px] w-[88px] items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--brand-accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--brand-accent)_6%,transparent)]">
							<Icon icon="mdi:shield" width={40} className="text-[var(--brand-accent)]" />
						</div>
					)}
					<p className="font-[family-name:var(--font-display)] text-[1.125rem] font-[700] tracking-[-0.01em] text-[var(--theme-text)]">
						{teamB.name}
					</p>
					{teamB.subtitle && (
						<p className="mt-0.5 text-[0.8125rem] text-[var(--theme-text-muted)]">
							{teamB.subtitle}
						</p>
					)}
				</div>
			</div>
		</SectionShell>
	);
}
