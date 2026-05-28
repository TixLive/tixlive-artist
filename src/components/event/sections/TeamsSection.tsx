import Image from 'next/image';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import type { ITeam } from '@/types';
import SectionShell from '@/components/event/sections/SectionShell';

interface TeamsSectionProps {
	teams: ITeam[];
}

function TeamCol({ team }: { team: ITeam }) {
	return (
		<div className="flex flex-1 flex-col items-center text-center">
			{team.logo_url ? (
				<Image
					src={team.logo_url}
					alt={team.name}
					width={88}
					height={88}
					className="mb-3 h-[88px] w-[88px] rounded-full object-contain"
				/>
			) : (
				<div className="mb-3 flex h-[88px] w-[88px] items-center justify-center rounded-full bg-[var(--bg-2)] text-[var(--ink-3)]">
					<Icon icon="mdi:shield" width={40} />
				</div>
			)}
			<p className="text-[18px] font-[700] tracking-[-0.012em] text-[var(--ink)]">{team.name}</p>
			{team.subtitle && <p className="mt-0.5 text-[13px] text-[var(--ink-3)]">{team.subtitle}</p>}
		</div>
	);
}

export default function TeamsSection({ teams }: TeamsSectionProps) {
	const { t } = useTranslation('common');
	if (teams.length < 2) return null;
	const [teamA, teamB] = teams;

	return (
		<SectionShell label={t('sections.match')}>
			<div
				className="flex items-center justify-center gap-4 rounded-[18px] bg-[var(--surface)] p-7 sm:gap-8"
				style={{ boxShadow: 'var(--shadow-2)' }}
			>
				<TeamCol team={teamA} />
				<span className="text-[32px] font-[800] tracking-[-0.03em] text-[var(--ink)] sm:text-[40px]">
					VS
				</span>
				<TeamCol team={teamB} />
			</div>
		</SectionShell>
	);
}
