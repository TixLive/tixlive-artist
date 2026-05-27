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
			<div className="flex min-h-[70vh] items-center justify-center bg-[var(--theme-bg)] px-4 py-12 md:py-20">
					<div className="w-full max-w-[27rem]">
						<div className="mb-6 flex flex-col items-center gap-5 text-center">
							<div className="flex h-16 w-16 items-center justify-center rounded-full border border-[color-mix(in_srgb,var(--brand-accent)_25%,transparent)] bg-[color-mix(in_srgb,var(--brand-accent)_6%,transparent)]">
								<Icon icon="mdi:email-outline" width={28} className="text-[var(--brand-accent)]" />
							</div>
							<div>
								<div className="font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[color-mix(in_srgb,var(--theme-text)_45%,transparent)]">
									{organizer?.name}
								</div>
								<h1 className="mt-2 font-[family-name:var(--font-display)] text-[1.75rem] font-[700] tracking-[-0.02em] text-[var(--theme-text)] sm:text-[2rem]">
									{t('auth.login_title')}
								</h1>
								<p className="mt-2 text-[0.9375rem] leading-relaxed text-[var(--theme-text-muted)]">
									{step === 'email' ? t('auth.login_subtitle') : t('auth.code_sent_to', { email })}
								</p>
							</div>
						</div>
						<div className="rounded-[22px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] p-6 shadow-[0_1px_2px_rgba(20,19,18,0.04),0_8px_24px_rgba(20,19,18,0.06)] sm:p-7">
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

import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import nextI18NextConfig from '@/i18n.config';

export const getStaticProps = async ({ locale }: { locale?: string }) => ({
  props: await serverSideTranslations(locale ?? 'ro', ['common'], nextI18NextConfig),
});
