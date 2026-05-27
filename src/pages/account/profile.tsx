import { useTranslation } from 'next-i18next';
import AccountLayout from '@/components/account/AccountLayout';
import ProfileForm from '@/components/account/ProfileForm';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { useGetMe } from '@/queries/me/useGetMe';
import { useOrganizer } from '@/contexts/OrganizerContext';
import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';
import type { IMe } from '@/types';

function ProfilePageContent() {
	const { t } = useTranslation('common');
	const { organizer } = useOrganizer();
	const { user } = useAuth();
	const { data: me } = useGetMe();

	const profileInitial: IMe = me ?? { email: user!.email, first_name: '', last_name: '', phone: '' };

	return (
		<AccountLayout organizer={organizer} email={user!.email} active="profile" title={t('account.profile')}>
			<ProfileForm initial={profileInitial} />
		</AccountLayout>
	);
}

const ProfilePage: NextPageWithLayout = function ProfilePage() {
	return (
		<ProtectedRoute>
			<ProfilePageContent />
		</ProtectedRoute>
	);
};

ProfilePage.getLayout = (page) => <Layout>{page}</Layout>;

export default ProfilePage;

import { staticI18nProps } from '@/lib/staticI18n';

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: staticI18nProps(locale),
});
