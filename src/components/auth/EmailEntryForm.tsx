import { useState } from 'react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { useRequestLoginCode } from '@/queries/auth/useRequestLoginCode';
import RecaptchaDisclaimer from '@/components/common/RecaptchaDisclaimer';

interface EmailEntryFormProps {
	initialEmail?: string;
	onCodeSent: (email: string, resendTime: number) => void;
	autoFocus?: boolean;
}

export default function EmailEntryForm({ initialEmail = '', onCodeSent, autoFocus = false }: EmailEntryFormProps) {
	const { t } = useTranslation('common');
	const [email, setEmail] = useState(initialEmail);
	const [error, setError] = useState(false);
	const requestCode = useRequestLoginCode();

	const handleSubmit = async () => {
		const trimmed = email.trim();
		if (!trimmed) return;
		setError(false);
		try {
			const data = await requestCode.mutateAsync(trimmed);
			onCodeSent(trimmed, typeof data.resendTime === 'number' ? data.resendTime : 0);
		} catch {
			setError(true);
		}
	};

	const sending = requestCode.isPending;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<label className="block text-[10.5px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">
					{t('auth.email_placeholder')}
				</label>
				<input
					type="email"
					placeholder={t('auth.email_placeholder')}
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter') handleSubmit();
					}}
					autoFocus={autoFocus}
					className="w-full rounded-[14px] border border-[var(--line)] bg-[var(--surface)] px-[18px] py-[16px] text-[15px] tracking-[-0.005em] text-[var(--ink)] placeholder:text-[var(--ink-4)] transition-shadow duration-150 focus:border-[var(--ink)] focus:outline-none focus:ring-[3px] focus:ring-black/[0.06]"
				/>
			</div>
			<button
				type="button"
				onClick={handleSubmit}
				disabled={!email.trim() || sending}
				className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--ink)] px-6 py-[15px] text-[15px] font-[600] tracking-[-0.012em] text-white transition-colors duration-150 hover:bg-[var(--ink-2)] disabled:cursor-not-allowed disabled:bg-[var(--bg-3)] disabled:text-[var(--ink-4)]"
			>
				{sending ? (
					<>
						<Icon icon="mdi:loading" width={14} className="animate-spin" />
						{t('auth.send_code')}
					</>
				) : (
					<>
						{t('auth.send_code')}
						<Icon icon="mdi:arrow-right" width={13} />
					</>
				)}
			</button>
			{error && (
				<p className="text-center text-[11.5px] font-[700] uppercase tracking-[0.06em] text-[#DC2626]">
					{t('auth.login_error')}
				</p>
			)}
			<RecaptchaDisclaimer />
		</div>
	);
}
