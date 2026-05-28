import { Trans } from 'next-i18next';

interface Props {
	className?: string;
}

export default function RecaptchaDisclaimer({ className }: Props) {
	return (
		<p
			className={
				className ??
				'text-center font-[family-name:var(--font-body)] text-[0.6875rem] leading-relaxed text-[var(--theme-text-muted)]'
			}
		>
			<Trans
				i18nKey="recaptcha.disclaimer"
				ns="common"
				components={{
					a1: (
						<a
							href="https://policies.google.com/privacy"
							target="_blank"
							rel="noopener noreferrer"
							className="underline hover:text-[var(--theme-text)]"
						/>
					),
					a2: (
						<a
							href="https://policies.google.com/terms"
							target="_blank"
							rel="noopener noreferrer"
							className="underline hover:text-[var(--theme-text)]"
						/>
					),
				}}
			/>
		</p>
	);
}
