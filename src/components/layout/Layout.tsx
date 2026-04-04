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
	cartQuantity?: number;
	cartTotal?: number;
	currency?: string;
	onCartClick?: () => void;
}

export default function Layout({ children, organizer, organizerName, logoUrl, socialLinks, cartQuantity, cartTotal, currency, onCartClick }: LayoutProps) {
	const name = organizerName ?? organizer?.name ?? '';
	const logo = logoUrl ?? organizer?.logo_url;
	const links = socialLinks ?? organizer?.social_links;
	const bio = organizer?.bio;

	return (
		<div className="flex min-h-screen flex-col">
			<AppHeader
				organizerName={name}
				logoUrl={logo}
				cartQuantity={cartQuantity}
				cartTotal={cartTotal}
				currency={currency}
				onCartClick={onCartClick}
			/>
			<main className="flex-1">{children}</main>
			<AppFooter
				organizerName={name}
				organizerBio={bio}
				logoUrl={logo}
				socialLinks={links}
			/>
		</div>
	);
}
