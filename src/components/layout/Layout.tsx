import type { ReactNode } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import type { IOrganizer } from '@/types';

interface LayoutProps {
	children: ReactNode;
	organizer?: IOrganizer;
	organizerName?: string;
	logoUrl?: string | null;
	socialLinks?: Record<string, string>;
}

export default function Layout({ children, organizer, organizerName, logoUrl, socialLinks }: LayoutProps) {
	const name = organizerName ?? organizer?.name ?? '';
	const logo = logoUrl ?? organizer?.logo_url;
	const links = socialLinks ?? organizer?.social_links;

	return (
		<div className="flex min-h-screen flex-col">
			<AppHeader organizerName={name} logoUrl={logo} />
			<main className="flex-1">{children}</main>
			<AppFooter socialLinks={links} />
		</div>
	);
}
