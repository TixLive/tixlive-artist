import { useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import { Button, Input } from '@heroui/react';
import { Icon } from '@iconify/react';
import { IOrganizer } from '@/types';
import { getSite, verifyMagicLink } from '@/lib/api';
import Layout from '@/components/layout/Layout';
import { setCookie } from 'cookies-next';

interface VerifyPageProps {
	organizer: IOrganizer;
	error?: string;
	brandPrimary: string;
	brandAccent: string;
}

export default function VerifyPage({ organizer, error, brandPrimary, brandAccent }: VerifyPageProps) {
	const { t } = useTranslation('common');
	const [showResend, setShowResend] = useState(false);
	const [email, setEmail] = useState('');
	const [sending, setSending] = useState(false);
	const [sent, setSent] = useState(false);
	const [sendError, setSendError] = useState(false);

	const handleResend = async () => {
		if (!email.trim()) return;

		setSending(true);
		setSendError(false);

		try {
			const res = await fetch('/api/auth/magic-link', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: email.trim() }),
			});

			if (res.ok) {
				setSent(true);
			} else {
				setSendError(true);
			}
		} catch {
			setSendError(true);
		} finally {
			setSending(false);
		}
	};

	const errorTitle =
		error === 'expired'
			? 'This link has expired.'
			: error === 'used'
				? 'This link has already been used.'
				: 'Invalid link.';

	const canRetry = error === 'expired' || error === 'used';

	return (
		<>
			<Head>
				<title>Verify — {organizer.name}</title>
			</Head>

			<style jsx global>{`
				:root {
					--brand-primary: ${/^#[0-9a-fA-F]{3,8}$/.test(brandPrimary || '') ? brandPrimary : '#6366f1'};
					--brand-accent: ${/^#[0-9a-fA-F]{3,8}$/.test(brandAccent || '') ? brandAccent : '#f59e0b'};
				}
			`}</style>

			<Layout organizerName={organizer.name} logoUrl={organizer.logo_url} socialLinks={organizer.social_links}>
				<div className="flex min-h-[60vh] items-center justify-center px-4 py-12">
					<div className="w-full max-w-sm text-center">
						{/* Error state */}
						<div className="flex flex-col items-center gap-4">
							<Icon icon="mdi:close-circle" className="h-16 w-16 text-red-500" />
							<h1 className="text-[1.25rem] font-semibold text-gray-900">{errorTitle}</h1>
						</div>

						{/* Resend flow */}
						{canRetry && !showResend && !sent && (
							<Button
								variant="solid"
								className="mt-6 rounded-full"
								style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
								onPress={() => setShowResend(true)}
							>
								Request a new link
							</Button>
						)}

						{canRetry && showResend && !sent && (
							<div className="mt-6 space-y-3">
								<Input
									type="email"
									placeholder="Enter your email"
									value={email}
									onValueChange={setEmail}
									classNames={{ inputWrapper: 'rounded-xl' }}
									onKeyDown={(e) => {
										if (e.key === 'Enter') handleResend();
									}}
								/>
								<Button
									variant="solid"
									className="w-full rounded-full"
									style={{ backgroundColor: 'var(--brand-primary)', color: '#fff' }}
									isLoading={sending}
									isDisabled={!email.trim() || sending}
									onPress={() => handleResend()}
								>
									Send new link
								</Button>
								{sendError && (
									<p className="text-[0.8125rem] text-red-500">
										Couldn&apos;t send email. Please try again.
									</p>
								)}
							</div>
						)}

						{/* Success */}
						{sent && (
							<div className="mt-6 flex flex-col items-center gap-2">
								<Icon icon="mdi:check-circle" className="h-10 w-10 text-green-500" />
								<p className="text-[0.9375rem] font-medium text-gray-700">Check your inbox!</p>
							</div>
						)}
					</div>
				</div>
			</Layout>
		</>
	);
}

export const getServerSideProps: GetServerSideProps<VerifyPageProps> = async ({ query, locale, req, res }) => {
	const token = query.t as string | undefined;

	if (!token) {
		return { redirect: { destination: '/', permanent: false } };
	}

	const organizer = await getSite();

	try {
		const result = await verifyMagicLink(token);

		if (result.success && result.email) {
			// Set attendee_session cookie
			const sessionValue = JSON.stringify({ email: result.email, organizer_id: organizer.id });

			setCookie('attendee_session', sessionValue, {
				req,
				res,
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 30 * 24 * 60 * 60,
				path: '/',
			});

			return { redirect: { destination: '/my-tickets', permanent: false } };
		}

		return {
			props: {
				organizer,
				error: 'invalid',
				brandPrimary: organizer.brand_primary_color || '',
				brandAccent: organizer.brand_accent_color || '',
				...(await serverSideTranslations(locale ?? 'en', ['common'])),
			},
		};
	} catch (err: any) {
		// Determine error type from the API response
		let errorType = 'invalid';
		const message = err?.message?.toLowerCase() ?? '';
		if (message.includes('expired')) {
			errorType = 'expired';
		} else if (message.includes('used')) {
			errorType = 'used';
		}

		return {
			props: {
				organizer,
				error: errorType,
				brandPrimary: organizer.brand_primary_color || '',
				brandAccent: organizer.brand_accent_color || '',
				...(await serverSideTranslations(locale ?? 'en', ['common'])),
			},
		};
	}
};
