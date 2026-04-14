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
		<div className="space-y-3">
			<Input
				type="email"
				placeholder={t('auth.email_placeholder')}
				value={email}
				onValueChange={setEmail}
				autoFocus={autoFocus}
				classNames={{ inputWrapper: 'rounded-xl' }}
				onKeyDown={(e) => {
					if (e.key === 'Enter') handleSubmit();
				}}
			/>
			<Button
				variant="solid"
				className="w-full rounded-xl font-[family-name:var(--font-display)] font-[700] text-[var(--theme-bg)]"
				style={{ backgroundColor: 'var(--brand-primary)' }}
				isLoading={sending}
				isDisabled={!email.trim() || sending}
				onPress={handleSubmit}
			>
				{t('auth.send_code')}
			</Button>
			{error && <p className="text-[0.8125rem] text-[#DC2626]">{t('auth.login_error')}</p>}
		</div>
	);
}
