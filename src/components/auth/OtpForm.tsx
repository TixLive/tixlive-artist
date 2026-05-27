import { useEffect, useState, useCallback } from 'react';
import { Button, InputOtp } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { validateLoginCode, resendLoginCode } from '@/lib/attendeeApi';

interface OtpFormProps {
	email: string;
	initialResendTime: number;
	onBack: () => void;
	onSuccess: () => void;
}

export default function OtpForm({ email, initialResendTime, onBack, onSuccess }: OtpFormProps) {
	const { t } = useTranslation('common');
	const [otp, setOtp] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const [resendTime, setResendTime] = useState(initialResendTime);
	const [resending, setResending] = useState(false);

	useEffect(() => {
		if (resendTime <= 0) return;
		const interval = setInterval(() => {
			setResendTime((prev) => (prev <= 1 ? 0 : prev - 1));
		}, 1000);
		return () => clearInterval(interval);
	}, [resendTime]);

	const validate = useCallback(
		async (code: string) => {
			if (code.length !== 6 || loading) return;

			setLoading(true);
			setError(false);

			try {
				await validateLoginCode(email, code);
				onSuccess();
			} catch {
				setError(true);
				setOtp('');
			} finally {
				setLoading(false);
			}
		},
		[email, loading, onSuccess]
	);

	const handleOtpChange = (val: string) => {
		setOtp(val);
		setError(false);
		if (val.length === 6) {
			validate(val);
		}
	};

	const handlePaste = async () => {
		try {
			const text = await navigator.clipboard.readText();
			const cleaned = text.replace(/\D/g, '').slice(0, 6);
			if (cleaned.length === 6) {
				setOtp(cleaned);
				validate(cleaned);
			}
		} catch {
			/* ignore */
		}
	};

	const handleResend = async () => {
		if (resendTime > 0 || resending) return;
		setResending(true);
		setError(false);
		try {
			const data = await resendLoginCode(email);
			setResendTime(typeof data.resendTime === 'number' ? data.resendTime : 60);
		} catch {
			/* ignore */
		} finally {
			setResending(false);
		}
	};

	const formatTime = (totalSeconds: number) => {
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = totalSeconds % 60;
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	};

	return (
		<div className="flex flex-col items-center gap-5">
			<button
				type="button"
				onClick={onBack}
				disabled={loading}
				className="inline-flex items-center gap-1.5 self-start font-[family-name:var(--font-body)] text-[0.8125rem] font-[600] text-[var(--brand-accent)] transition-colors duration-200 hover:text-[var(--theme-text)] disabled:opacity-60"
			>
				<Icon icon="mdi:arrow-left" width={16} />
				{t('auth.back')}
			</button>

			<div className="w-full text-center">
				<div className="font-[family-name:var(--font-mono)] text-[0.625rem] uppercase tracking-[0.15em] text-[color-mix(in_srgb,var(--theme-text)_45%,transparent)]">
					{t('auth.please_enter_code')}
				</div>
				<p className="mt-1.5 font-[family-name:var(--font-data)] text-[0.9375rem] font-[600] text-[var(--theme-text)]">
					{email}
				</p>
			</div>

			<InputOtp
				length={6}
				value={otp}
				onValueChange={handleOtpChange}
				isInvalid={error}
				isDisabled={loading}
				size="lg"
			/>

			{error && (
				<p className="font-[family-name:var(--font-mono)] text-[0.6875rem] uppercase tracking-[0.05em] text-[#DC2626]">
					{t('auth.otp_invalid')}
				</p>
			)}

			<div className="flex w-full items-center justify-between gap-3">
				<Button
					variant="bordered"
					size="sm"
					className="rounded-full border-[color-mix(in_srgb,var(--theme-text)_12%,transparent)] font-[family-name:var(--font-body)] font-[600] text-[var(--theme-text)]"
					startContent={<Icon icon="mdi:content-paste" width={16} />}
					onPress={handlePaste}
					isDisabled={loading}
				>
					{t('auth.paste_code')}
				</Button>

				<Button
					variant="light"
					size="sm"
					className="rounded-full font-[family-name:var(--font-body)] font-[600] text-[var(--brand-accent)]"
					onPress={handleResend}
					isDisabled={resendTime > 0 || loading || resending}
					isLoading={resending}
				>
					{resendTime > 0 ? t('auth.resend_code_in', { time: formatTime(resendTime) }) : t('auth.resend_code')}
				</Button>
			</div>
		</div>
	);
}
