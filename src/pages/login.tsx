import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import { IOrganizer } from '@/types';
import { getSite } from '@/lib/api';
import Layout from '@/components/layout/Layout';
import EmailEntryForm from '@/components/auth/EmailEntryForm';
import OtpForm from '@/components/auth/OtpForm';
import { AttendeePageMiddleware } from '@/middleware/Attendee.Middleware';

interface LoginPageProps {
	organizer: IOrganizer;
	brandPrimary: string;
	brandAccent: string;
	nextPath: string;
}

export default function LoginPage({ organizer, brandPrimary, brandAccent, nextPath }: LoginPageProps) {
	const { t } = useTranslation('common');
	const router = useRouter();
	const [step, setStep] = useState<'email' | 'otp'>('email');
	const [email, setEmail] = useState('');
	const [resendTime, setResendTime] = useState(0);

	const handleCodeSent = (sentEmail: string, time: number) => {
		setEmail(sentEmail);
		setResendTime(time);
		setStep('otp');
	};

	const handleSuccess = () => {
		router.push(nextPath);
	};

	const handleBack = () => {
		setStep('email');
	};

	return (
		<>
			<Head>
				<title>{t('auth.login_title')} — {organizer.name}</title>
			</Head>

			<style jsx global>{`
				:root {
					--brand-primary: ${/^#[0-9a-fA-F]{3,8}$/.test(brandPrimary || '') ? brandPrimary : '#2D2A26'};
					--brand-accent: ${/^#[0-9a-fA-F]{3,8}$/.test(brandAccent || '') ? brandAccent : '#8B6914'};
				}
			`}</style>

			<Layout organizerName={organizer.name} logoUrl={organizer.logo_url} socialLinks={organizer.social_links}>
				<div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
					<div className="w-full max-w-sm">
						<div className="mb-8 flex flex-col items-center gap-4 text-center">
							<div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--brand-accent)_12%,transparent)]">
								<Icon icon="mdi:email-outline" width={28} className="text-[var(--brand-accent)]" />
							</div>
							<div>
								<h1 className="font-[family-name:var(--font-display)] text-[1.375rem] font-[800] tracking-tight text-[var(--theme-text)]">
									{t('auth.login_title')}
								</h1>
								<p className="mt-2 text-[0.875rem] text-[var(--theme-text-muted)]">
									{step === 'email' ? t('auth.login_subtitle') : t('auth.code_sent_to', { email })}
								</p>
							</div>
						</div>

						{step === 'email' ? (
							<EmailEntryForm onCodeSent={handleCodeSent} autoFocus />
						) : (
							<OtpForm
								email={email}
								initialResendTime={resendTime}
								onBack={handleBack}
								onSuccess={handleSuccess}
							/>
						)}
					</div>
				</div>
			</Layout>
		</>
	);
}

function safeNext(nextParam: string | string[] | undefined): string {
	if (typeof nextParam !== 'string') return '/my-tickets';
	if (nextParam.startsWith('//')) return '/my-tickets';
	if (nextParam !== '/my-tickets' && !nextParam.startsWith('/my-tickets/') && !nextParam.startsWith('/my-tickets?')) {
		return '/my-tickets';
	}
	return nextParam;
}

export const getServerSideProps: GetServerSideProps<LoginPageProps> = async (ctx) => {
	const { query, locale } = ctx;
	const nextPath = safeNext(query.next);

	// If the attendee is already authenticated (or can silently refresh), skip
	// the login screen entirely and send them to wherever they were headed.
	const attendee = await AttendeePageMiddleware(ctx);
	if (attendee) {
		return { redirect: { destination: nextPath, permanent: false } };
	}

	const organizer = await getSite();

	return {
		props: {
			organizer,
			brandPrimary: organizer.brand_primary_color || '',
			brandAccent: organizer.brand_accent_color || '',
			nextPath,
			...(await serverSideTranslations(locale ?? 'en', ['common'])),
		},
	};
};
