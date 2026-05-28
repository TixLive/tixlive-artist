import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import type { IMe } from '@/types';

interface AttendeeIdentityRowProps {
	me: IMe;
	onEditPress: () => void;
}

function getInitials(me: IMe): string {
	const first = (me.first_name ?? '').trim();
	const last = (me.last_name ?? '').trim();
	if (first || last) return (`${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || '?');
	return me.email.charAt(0).toUpperCase() || '?';
}

export default function AttendeeIdentityRow({ me, onEditPress }: AttendeeIdentityRowProps) {
	const { t } = useTranslation('common');
	const fullName = [me.first_name, me.last_name].filter(Boolean).join(' ').trim();
	const hasPhone = Boolean(me.phone && me.phone.trim());

	return (
		<div className="flex items-center gap-4 rounded-[18px] bg-[var(--ink)] px-5 py-4 text-white">
			<div
				className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[14px] font-[700] text-[var(--ink)]"
				aria-hidden
			>
				{getInitials(me)}
			</div>
			<div className="flex min-w-0 flex-1 flex-col">
				<span className="text-[15px] font-[700] tracking-[-0.012em] text-white">
					{fullName || me.email}
				</span>
				<div className="flex min-w-0 items-center gap-1.5 text-[12.5px] text-white/65">
					<Icon icon="mdi:lock-outline" width={11} className="shrink-0" aria-label={t('checkout.account_email')} />
					<span className="truncate">{me.email}</span>
					{hasPhone ? (
						<>
							<span aria-hidden>·</span>
							<span className="truncate">{me.phone}</span>
						</>
					) : (
						<>
							<span aria-hidden>·</span>
							<button
								type="button"
								onClick={onEditPress}
								className="text-white underline-offset-2 hover:underline"
							>
								{t('checkout.add_phone')}
							</button>
						</>
					)}
				</div>
			</div>
			<button
				type="button"
				onClick={onEditPress}
				className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2 text-[12.5px] font-[600] tracking-[-0.005em] text-white transition-colors duration-150 hover:bg-white/25"
				aria-label={t('checkout.edit_profile_aria')}
			>
				<Icon icon="mdi:pencil-outline" width={13} />
				<span className="hidden sm:inline">{t('checkout.edit_profile')}</span>
			</button>
		</div>
	);
}
