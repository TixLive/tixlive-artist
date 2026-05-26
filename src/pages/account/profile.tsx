import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import AccountLayout from '@/components/account/AccountLayout';
import ProfileForm from '@/components/account/ProfileForm';
import { useAttendee } from '@/hooks/useAttendee';
import { useOrganizer } from '@/contexts/OrganizerContext';
import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';
import type { IMe } from '@/types';

const ProfilePage: NextPageWithLayout = function ProfilePage() {
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
		let cancelled = false;
		fetch('/api/me')
			.then((r) => (r.ok ? r.json() : null))
			.then((data) => {
				if (!cancelled && data && typeof data.email === 'string') setMe(data as IMe);
			})
			.catch(() => {});
		return () => { cancelled = true; };
	}, [attendee]);

	if (authLoading || !attendee) return null;

	const profileInitial: IMe = me ?? { email: attendee.email, first_name: '', last_name: '', phone: '' };

	return (
		<AccountLayout organizer={organizer} email={attendee.email} active="profile" title={t('account.profile')}>
			<ProfileForm initial={profileInitial} />
		</AccountLayout>
	);
};

ProfilePage.getLayout = (page) => <Layout>{page}</Layout>;

export default ProfilePage;

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/i18n.config';

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: await serverSideTranslations(locale ?? 'ro', ['common'], nextI18NextConfig),
});