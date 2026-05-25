import { Button } from '@heroui/react';
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
	if (first || last) {
		return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || '?';
	}
	return me.email.charAt(0).toUpperCase() || '?';
}

export default function AttendeeIdentityRow({ me, onEditPress }: AttendeeIdentityRowProps) {
	const { t } = useTranslation('common');
	const fullName = [me.first_name, me.last_name].filter(Boolean).join(' ').trim();
	const hasPhone = Boolean(me.phone && me.phone.trim());

	return (
		<div className="flex items-center gap-4 rounded-[22px] bg-[var(--brand-primary)] px-5 py-4 text-[var(--theme-bg)]">
			<div
				className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-[family-name:var(--font-display)] text-[0.875rem] font-[700] text-white"
				style={{ backgroundColor: 'var(--brand-accent)' }}
				aria-hidden
			>
				{getInitials(me)}
			</div>
			<div className="flex min-w-0 flex-1 flex-col">
				<span className="font-[family-name:var(--font-display)] text-[1rem] font-[700] tracking-[-0.01em] text-[var(--theme-bg)]">
					{fullName || me.email}
				</span>
				<div className="flex min-w-0 items-center gap-1.5 text-[0.8125rem] text-[color-mix(in_srgb,var(--theme-bg)_65%,transparent)]">
					<Icon icon="mdi:lock-outline" width={12} className="shrink-0" aria-label={t('checkout.account_email')} />
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
								className="text-[var(--brand-accent)] underline-offset-2 hover:underline"
							>
								{t('checkout.add_phone')}
							</button>
						</>
					)}
				</div>
			</div>
			<Button
				variant="bordered"
				size="sm"
				onPress={onEditPress}
				className="shrink-0 rounded-full border-[color-mix(in_srgb,var(--theme-bg)_25%,transparent)] font-[family-name:var(--font-body)] font-[600] text-[var(--theme-bg)]"
				aria-label={t('checkout.edit_profile_aria')}
			>
				<Icon icon="mdi:pencil-outline" width={16} />
				<span className="hidden sm:inline">{t('checkout.edit_profile')}</span>
			</Button>
		</div>
	);
}
