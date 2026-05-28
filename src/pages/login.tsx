import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Icon } from '@iconify/react';
import { useOrganizer } from '@/contexts/OrganizerContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import type { NextPageWithLayout } from '@/pages/_app';
import EmailEntryForm from '@/components/auth/EmailEntryForm';
import OtpForm from '@/components/auth/OtpForm';

function safeNext(fromParam: string | string[] | undefined): string {
	if (typeof fromParam !== 'string') return '/account/tickets';
	if (fromParam.startsWith('//')) return '/account/tickets';
	if (!fromParam.startsWith('/account')) return '/account/tickets';
	return fromParam;
}

const LoginPage: NextPageWithLayout = function LoginPage() {
	const { t } = useTranslation('common');
	const router = useRouter();
	const { organizer } = useOrganizer();
	const { user, loading: authLoading, refresh } = useAuth();
	const nextPath = safeNext(router.query.from ?? router.query.next);
	const [step, setStep] = useState<'email' | 'otp'>('email');
	const [email, setEmail] = useState('');
	const [resendTime, setResendTime] = useState(0);

	useEffect(() => {
		if (!authLoading && user) router.replace(nextPath);
	}, [authLoading, user, nextPath, router]);

	const handleCodeSent = (sentEmail: string, time: number) => {
		setEmail(sentEmail);
		setResendTime(time);
		setStep('otp');
	};

	if (authLoading || user) return null;

	return (
		<>
			<Head>
				<title>{`${t('auth.login_title')} — ${organizer?.name ?? ''}`}</title>
			</Head>
			<div className="flex min-h-[70vh] items-center justify-center bg-[var(--bg)] px-4 py-12 md:py-20">
				<div className="w-full max-w-[27rem]">
					<div className="mb-6 flex flex-col items-center gap-5 text-center">
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--bg-2)] text-[var(--ink)]">
							<Icon icon="mdi:email-outline" width={26} />
						</div>
						<div>
							{organizer?.name && (
								<div className="text-[11px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">
									{organizer.name}
								</div>
							)}
							<h1 className="m-0 mt-2 text-[28px] font-[800] tracking-[-0.03em] text-[var(--ink)] sm:text-[32px]">
								{t('auth.login_title')}
							</h1>
							<p className="mt-2 text-[14px] leading-[1.55] text-[var(--ink-3)]">
								{step === 'email' ? t('auth.login_subtitle') : t('auth.code_sent_to', { email })}
							</p>
						</div>
					</div>
					<div className="rounded-[18px] bg-[var(--surface)] p-6 sm:p-7" style={{ boxShadow: 'var(--shadow-2)' }}>
						{step === 'email' ? (
							<EmailEntryForm onCodeSent={handleCodeSent} autoFocus />
						) : (
							<OtpForm
								email={email}
								initialResendTime={resendTime}
								onBack={() => setStep('email')}
								onSuccess={async () => {
									await refresh();
									await router.push(nextPath);
								}}
							/>
						)}
					</div>
				</div>
			</div>
			</>
		);
};

LoginPage.getLayout = (page) => <Layout>{page}</Layout>;

export default LoginPage;

import { staticI18nProps } from '@/lib/staticI18n';

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: staticI18nProps(locale),
});
