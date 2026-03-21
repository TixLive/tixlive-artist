import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';

const SOCIAL_ICON_MAP: Record<string, string> = {
	instagram: 'mdi:instagram',
	facebook: 'mdi:facebook',
	twitter: 'mdi:twitter',
	youtube: 'mdi:youtube',
	tiktok: 'ic:baseline-tiktok',
	linkedin: 'mdi:linkedin',
};

interface AppFooterProps {
	socialLinks?: Record<string, string>;
}

export default function AppFooter({ socialLinks }: AppFooterProps) {
	const { t } = useTranslation('common');

	return (
		<footer className="border-t border-default-200 bg-[var(--theme-surface)]">
			<div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-6 sm:flex-row sm:justify-between">
				{/* Social links */}
				{socialLinks && Object.keys(socialLinks).length > 0 && (
					<div className="flex items-center gap-3">
						{Object.entries(socialLinks).map(([platform, url]) => (
							<a
								key={platform}
								href={url}
								target="_blank"
								rel="noopener noreferrer"
								aria-label={`Follow us on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`}
								className="flex min-h-[44px] min-w-[44px] items-center justify-center text-default-500 transition-colors hover:text-[var(--brand-primary)]"
							>
								<Icon icon={SOCIAL_ICON_MAP[platform] || 'mdi:link'} width={22} />
							</a>
						))}
					</div>
				)}

				{/* Credit */}
				<p className="text-xs text-default-400">
					{t('footer.powered_by')}{' '}
					<a
						href="https://tix.live"
						target="_blank"
						rel="noopener noreferrer"
						className="font-medium text-[var(--brand-primary)] hover:underline"
					>
						TixLive
					</a>
				</p>
			</div>
		</footer>
	);
}
