import { useState } from 'react';
import { Button, Input } from '@heroui/react';
import { useTranslation } from 'next-i18next';

interface EmailEntryFormProps {
	initialEmail?: string;
	onCodeSent: (email: string, resendTime: number) => void;
	autoFocus?: boolean;
}

export default function EmailEntryForm({ initialEmail = '', onCodeSent, autoFocus = false }: EmailEntryFormProps) {
	const { t } = useTranslation('common');
	const [email, setEmail] = useState(initialEmail);
	const [sending, setSending] = useState(false);
	const [error, setError] = useState(false);

	const handleSubmit = async () => {
		const trimmed = email.trim();
		if (!trimmed) return;

		setSending(true);
		setError(false);

		try {
			const res = await fetch('/api/auth/email-code', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: trimmed }),
			});

			const data = await res.json().catch(() => ({}));

			if (res.ok) {
				onCodeSent(trimmed, typeof data.resendTime === 'number' ? data.resendTime : 0);
			} else {
				setError(true);
			}
		} catch {
			setError(true);
		} finally {
			setSending(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="space-y-2">
				<label className="block font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[var(--theme-text-muted)]">
					{t('auth.email_placeholder')}
				</label>
				<Input
					type="email"
					placeholder={t('auth.email_placeholder')}
					value={email}
					onValueChange={setEmail}
					autoFocus={autoFocus}
					classNames={{
						inputWrapper:
							'rounded-full border border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] bg-[var(--theme-bg)] px-5 shadow-none data-[hover=true]:bg-[var(--theme-bg)] group-data-[focus=true]:border-[var(--brand-accent)]',
						input: 'font-[family-name:var(--font-body)] text-[0.9375rem]',
					}}
					onKeyDown={(e) => {
						if (e.key === 'Enter') handleSubmit();
					}}
				/>
			</div>
			<Button
				variant="solid"
				size="lg"
				className="w-full rounded-full font-[family-name:var(--font-body)] text-[0.9375rem] font-[700] text-[var(--theme-bg)]"
				style={{ backgroundColor: 'var(--brand-primary)' }}
				isLoading={sending}
				isDisabled={!email.trim() || sending}
				onPress={handleSubmit}
			>
				{t('auth.send_code')}
			</Button>
			{error && (
				<p className="text-center font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.05em] text-[#DC2626]">
					{t('auth.login_error')}
				</p>
			)}
		</div>
	);
}
