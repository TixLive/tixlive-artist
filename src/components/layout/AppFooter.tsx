import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'next-i18next';

interface AppFooterProps {
	organizerName?: string;
	organizerBio?: string | null;
	logoUrl?: string | null;
	socialLinks?: Record<string, string>;
}

export default function AppFooter({ organizerName, organizerBio, logoUrl }: AppFooterProps) {
	const { t } = useTranslation('common');

	return (
		<footer className="bg-[var(--theme-bg)]">
			<div className="border-t border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)]">
				<div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-12">
					<div className="grid grid-cols-2 gap-8 md:grid-cols-4">
						{/* Organizer info */}
						<div className="col-span-2 md:col-span-1">
							<div className="flex items-center gap-2.5">
								{logoUrl && (
									<Image src={logoUrl} alt={organizerName ?? ''} width={32} height={32} className="rounded-lg" />
								)}
								<span className="font-[family-name:var(--font-display)] text-[1.0625rem] font-bold text-[var(--theme-text)]">
									{organizerName}
								</span>
							</div>
							{organizerBio && (
								<p className="mt-2.5 text-[0.8125rem] leading-relaxed text-[color-mix(in_srgb,var(--theme-text)_45%,transparent)]">
									{organizerBio}
								</p>
							)}
						</div>

						{/* Links */}
						<div>
							<h3 className="mb-4 font-[family-name:var(--font-display)] text-[0.875rem] font-semibold text-[var(--theme-text)]">
								Link-uri
							</h3>
							<ul className="space-y-2.5 text-[0.8125rem]">
								<li>
									<Link href="/" className="text-[color-mix(in_srgb,var(--theme-text)_50%,transparent)] transition-colors hover:text-[var(--theme-text)]">
										Bilete
									</Link>
								</li>
								<li>
									<Link href="/" className="text-[color-mix(in_srgb,var(--theme-text)_50%,transparent)] transition-colors hover:text-[var(--theme-text)]">
										Despre
									</Link>
								</li>
								<li>
									<Link href="/" className="text-[color-mix(in_srgb,var(--theme-text)_50%,transparent)] transition-colors hover:text-[var(--theme-text)]">
										Toate evenimentele
									</Link>
								</li>
							</ul>
						</div>

						{/* Legal */}
						<div>
							<h3 className="mb-4 font-[family-name:var(--font-display)] text-[0.875rem] font-semibold text-[var(--theme-text)]">
								Legal
							</h3>
							<ul className="space-y-2.5 text-[0.8125rem]">
								<li>
									<a href="#" className="text-[color-mix(in_srgb,var(--theme-text)_50%,transparent)] transition-colors hover:text-[var(--theme-text)]">
										Termeni
									</a>
								</li>
								<li>
									<a href="#" className="text-[color-mix(in_srgb,var(--theme-text)_50%,transparent)] transition-colors hover:text-[var(--theme-text)]">
										Confidențialitate
									</a>
								</li>
							</ul>
						</div>

						{/* Contact */}
						<div>
							<h3 className="mb-4 font-[family-name:var(--font-display)] text-[0.875rem] font-semibold text-[var(--theme-text)]">
								Contact
							</h3>
							<ul className="space-y-2.5 text-[0.8125rem]">
								<li>
									<a href="mailto:support@tix.live" className="text-[color-mix(in_srgb,var(--theme-text)_50%,transparent)] transition-colors hover:text-[var(--theme-text)]">
										support@tix.live
									</a>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</div>

			{/* Bottom bar */}
			<div className="border-t border-[color-mix(in_srgb,var(--theme-text)_6%,transparent)]">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
					<p className="text-[0.75rem] text-[color-mix(in_srgb,var(--theme-text)_35%,transparent)]">
						© {new Date().getFullYear()} {organizerName}. Toate drepturile rezervate.
					</p>
					<p className="text-[0.75rem] text-[color-mix(in_srgb,var(--theme-text)_35%,transparent)]">
						Powered by{' '}
						<a
							href="https://tix.live"
							target="_blank"
							rel="noopener noreferrer"
							className="font-bold text-[var(--theme-text)] hover:underline"
						>
							TIX LIVE
						</a>
					</p>
				</div>
			</div>
		</footer>
	);
}
