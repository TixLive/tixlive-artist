import { Avatar, Button, Chip } from '@heroui/react';
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
		<div className="flex items-center justify-between gap-3 rounded-xl border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] px-4 py-3">
			<div className="flex min-w-0 items-center gap-3">
				<Avatar
					size="sm"
					name={getInitials(me)}
					classNames={{
						base: 'bg-[color-mix(in_srgb,var(--brand-accent)_15%,transparent)] text-[var(--brand-accent)] flex-shrink-0',
					}}
					aria-hidden
				/>
				<div className="flex min-w-0 flex-col">
					<div className="flex min-w-0 items-center gap-2">
						<span className="truncate text-[0.9375rem] font-[600] text-[var(--theme-text)]">
							{fullName || me.email}
						</span>
						<Chip size="sm" variant="bordered" className="hidden flex-shrink-0 sm:inline-flex">
							{t('checkout.account_email')}
						</Chip>
					</div>
					<div className="flex min-w-0 items-center gap-1 text-[0.8125rem] text-[var(--theme-text-muted)]">
						<Icon
							icon="mdi:lock-outline"
							width={12}
							className="flex-shrink-0 text-[var(--theme-text-muted)] sm:hidden"
							aria-label={t('checkout.account_email')}
						/>
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
			</div>
			<Button
				variant="light"
				size="sm"
				onPress={onEditPress}
				className="flex-shrink-0 text-[var(--brand-accent)]"
				aria-label={t('checkout.edit_profile_aria')}
			>
				<Icon icon="mdi:pencil-outline" width={16} />
				<span className="hidden sm:inline">{t('checkout.edit_profile')}</span>
			</Button>
		</div>
	);
}
