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
		<footer className="mt-auto bg-[var(--theme-surface)]">
			<div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
				<div className="grid grid-cols-2 gap-10 md:grid-cols-4">
					{/* Organizer info */}
					<div className="col-span-2 md:col-span-1">
						<div className="flex items-center gap-3">
							{logoUrl && (
								<Image src={logoUrl} alt={organizerName ?? ''} width={28} height={28} className="rounded-md" />
							)}
							<span className="font-[family-name:var(--font-display)] text-[1rem] font-[800] tracking-tight text-[var(--theme-text)]">
								{organizerName}
							</span>
						</div>
						{organizerBio && (
							<p className="mt-3 text-[0.8125rem] leading-relaxed text-[var(--theme-text-muted)]">
								{organizerBio}
							</p>
						)}
					</div>

					{/* Links */}
					<div>
						<h3 className="mb-4 font-[family-name:var(--font-display)] text-[0.75rem] font-[700] uppercase tracking-[0.05em] text-[var(--theme-text-muted)]">
							Link-uri
						</h3>
						<ul className="space-y-3 text-[0.8125rem]">
							<li>
								<Link href="/" className="text-[var(--theme-text-muted)] transition-colors duration-200 hover:text-[var(--theme-text)]">
									Bilete
								</Link>
							</li>
							<li>
								<Link href="/" className="text-[var(--theme-text-muted)] transition-colors duration-200 hover:text-[var(--theme-text)]">
									Despre
								</Link>
							</li>
							<li>
								<Link href="/" className="text-[var(--theme-text-muted)] transition-colors duration-200 hover:text-[var(--theme-text)]">
									Toate evenimentele
								</Link>
							</li>
						</ul>
					</div>

					{/* Legal */}
					<div>
						<h3 className="mb-4 font-[family-name:var(--font-display)] text-[0.75rem] font-[700] uppercase tracking-[0.05em] text-[var(--theme-text-muted)]">
							Legal
						</h3>
						<ul className="space-y-3 text-[0.8125rem]">
							<li>
								<a href="#" className="text-[var(--theme-text-muted)] transition-colors duration-200 hover:text-[var(--theme-text)]">
									Termeni
								</a>
							</li>
							<li>
								<a href="#" className="text-[var(--theme-text-muted)] transition-colors duration-200 hover:text-[var(--theme-text)]">
									Confidențialitate
								</a>
							</li>
						</ul>
					</div>

					{/* Contact */}
					<div>
						<h3 className="mb-4 font-[family-name:var(--font-display)] text-[0.75rem] font-[700] uppercase tracking-[0.05em] text-[var(--theme-text-muted)]">
							Contact
						</h3>
						<ul className="space-y-3 text-[0.8125rem]">
							<li>
								<a href="mailto:support@tix.live" className="text-[var(--theme-text-muted)] transition-colors duration-200 hover:text-[var(--theme-text)]">
									support@tix.live
								</a>
							</li>
						</ul>
					</div>
				</div>
			</div>

			{/* Bottom bar */}
			<div className="border-t border-[color-mix(in_srgb,var(--theme-text)_6%,transparent)]">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
					<p className="text-[0.75rem] text-[var(--theme-text-muted)]">
						© {new Date().getFullYear()} {organizerName}
					</p>
					<p className="text-[0.75rem] text-[var(--theme-text-muted)]">
						Powered by{' '}
						<a
							href="https://tix.live"
							target="_blank"
							rel="noopener noreferrer"
							className="font-[family-name:var(--font-display)] font-[700] text-[var(--theme-text)] transition-colors duration-200 hover:text-[var(--brand-accent)]"
						>
							TIX LIVE
						</a>
					</p>
				</div>
			</div>
		</footer>
	);
}
