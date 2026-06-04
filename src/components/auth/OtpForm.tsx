import { useEffect, useState, useCallback } from 'react';
import { InputOtp } from '@heroui/react';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { useValidateLoginCode } from '@/queries/auth/useValidateLoginCode';
import { useResendLoginCode } from '@/queries/auth/useResendLoginCode';
import RecaptchaDisclaimer from '@/components/common/RecaptchaDisclaimer';
import { trackEvent as clarityEvent } from '@/lib/clarity';
import { CLARITY_EVENTS } from '@/lib/clarity.constants';

interface OtpFormProps {
	email: string;
	initialResendTime: number;
	onBack: () => void;
	onSuccess: () => void;
}

export default function OtpForm({ email, initialResendTime, onBack, onSuccess }: OtpFormProps) {
	const { t } = useTranslation('common');
	const [otp, setOtp] = useState('');
	const [error, setError] = useState(false);
	const [resendTime, setResendTime] = useState(initialResendTime);
	const validate = useValidateLoginCode();
	const resend = useResendLoginCode();
	const loading = validate.isPending;
	const resending = resend.isPending;

	useEffect(() => {
		if (resendTime <= 0) return;
		const interval = setInterval(() => {
			setResendTime((prev) => (prev <= 1 ? 0 : prev - 1));
		}, 1000);
		return () => clearInterval(interval);
	}, [resendTime]);

	const submitCode = useCallback(
		async (code: string) => {
			if (code.length !== 6 || loading) return;
			setError(false);
			try {
				await validate.mutateAsync({ email, code });
				clarityEvent(CLARITY_EVENTS.LOGIN_SUCCESS);
				onSuccess();
			} catch {
				clarityEvent(CLARITY_EVENTS.LOGIN_FAILED);
				setError(true);
				setOtp('');
			}
		},
		[email, loading, onSuccess, validate]
	);

	const handleOtpChange = (val: string) => {
		setOtp(val);
		setError(false);
		if (val.length === 6) submitCode(val);
	};

	const handlePaste = async () => {
		try {
			const text = await navigator.clipboard.readText();
			const cleaned = text.replace(/\D/g, '').slice(0, 6);
			if (cleaned.length === 6) {
				setOtp(cleaned);
				submitCode(cleaned);
			}
		} catch {}
	};

	const handleResend = async () => {
		if (resendTime > 0 || resending) return;
		setError(false);
		try {
			const data = await resend.mutateAsync(email);
			setResendTime(typeof data.resendTime === 'number' ? data.resendTime : 60);
		} catch {}
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
				className="inline-flex items-center gap-1.5 self-start text-[13px] font-[600] tracking-[-0.005em] text-[var(--ink-3)] transition-colors duration-150 hover:text-[var(--ink)] disabled:opacity-60"
			>
				<Icon icon="mdi:chevron-left" width={13} />
				{t('auth.back')}
			</button>

			<div className="w-full text-center">
				<div className="text-[10.5px] font-[700] uppercase tracking-[0.12em] text-[var(--ink-3)]">
					{t('auth.please_enter_code')}
				</div>
				<p className="m-0 mt-1.5 text-[15px] font-[700] tabular-nums tracking-[-0.005em] text-[var(--ink)]">
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
				<p className="m-0 text-[11.5px] font-[700] uppercase tracking-[0.06em] text-[#DC2626]">
					{t('auth.otp_invalid')}
				</p>
			)}

			<div className="flex w-full items-center justify-between gap-3">
				<button
					type="button"
					onClick={handlePaste}
					disabled={loading}
					className="inline-flex items-center gap-1.5 rounded-full bg-[var(--bg-2)] px-4 py-2 text-[12.5px] font-[600] tracking-[-0.005em] text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--bg-3)] disabled:opacity-60"
				>
					<Icon icon="mdi:content-paste" width={13} />
					{t('auth.paste_code')}
				</button>

				<button
					type="button"
					onClick={handleResend}
					disabled={resendTime > 0 || loading || resending}
					className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12.5px] font-[600] tracking-[-0.005em] text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--bg-2)] disabled:cursor-not-allowed disabled:text-[var(--ink-4)] disabled:hover:bg-transparent"
				>
					{resending && <Icon icon="mdi:loading" width={13} className="animate-spin" />}
					{resendTime > 0 ? t('auth.resend_code_in', { time: formatTime(resendTime) }) : t('auth.resend_code')}
				</button>
			</div>

			<RecaptchaDisclaimer />
		</div>
	);
}
