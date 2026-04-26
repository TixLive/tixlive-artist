import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import AccountLayout from '@/components/account/AccountLayout';
import ProfileForm from '@/components/account/ProfileForm';
import { getSite, getMe } from '@/lib/api';
import { withAttendeeAuth } from '@/middleware/Attendee.Middleware';
import { ACCESS_COOKIE } from '@/lib/cookies';
import type { IMe, IOrganizer } from '@/types';

interface ProfilePageProps {
	organizer: IOrganizer;
	me: IMe;
	brandPrimary: string;
	brandAccent: string;
}

export default function ProfilePage({ organizer, me, brandPrimary, brandAccent }: ProfilePageProps) {
	const { t } = useTranslation('common');

	return (
		<AccountLayout
			organizer={organizer}
			brandPrimary={brandPrimary}
			brandAccent={brandAccent}
			email={me.email}
			active="profile"
			title={t('account.profile')}
		>
			<ProfileForm initial={me} />
		</AccountLayout>
	);
}

export const getServerSideProps = withAttendeeAuth<ProfilePageProps>(async (ctx, attendee) => {
	const token = ctx.req.cookies?.[ACCESS_COOKIE] || '';
	let me: IMe;
	try {
		me = await getMe(token);
	} catch {
		// Fallback to cookie-derived identity if the backend is temporarily down
		me = { email: attendee.email, first_name: '', last_name: '', phone: '' };
	}

	const organizer = await getSite();

	return {
		props: {
			organizer,
			me,
			brandPrimary: organizer.brand_primary_color || '',
			brandAccent: organizer.brand_accent_color || '',
			...(await serverSideTranslations(ctx.locale ?? 'en', ['common'])),
		},
	};
});
