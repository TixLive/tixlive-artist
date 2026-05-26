import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import AccountLayout from '@/components/account/AccountLayout';
import ProfileForm from '@/components/account/ProfileForm';
import { useAttendee } from '@/hooks/useAttendee';
import { useOrganizer } from '@/contexts/OrganizerContext';
import type { IMe } from '@/types';

export default function ProfilePage() {
	const { t } = useTranslation('common');
	const router = useRouter();
	const { organizer } = useOrganizer();
	const { attendee, loading: authLoading } = useAttendee();
	const [me, setMe] = useState<IMe | null>(null);

	useEffect(() => {
		if (!authLoading && !attendee) { router.replace(`/login?next=${encodeURIComponent(router.asPath)}`); }
	}, [authLoading, attendee, router]);

	useEffect(() => {
		if (!attendee) return;
		fetch('/api/me').then(r => r.json()).then(setMe).catch(() => {});
	}, [attendee]);

	if (authLoading || !attendee) return null;

	const profileInitial: IMe = me ?? { email: attendee.email, first_name: '', last_name: '', phone: '' };

	return (
		<AccountLayout organizer={organizer} email={attendee.email} active="profile" title={t('account.profile')}>
			<ProfileForm initial={profileInitial} />
		</AccountLayout>
	);
}
