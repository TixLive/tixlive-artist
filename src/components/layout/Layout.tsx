import type { ReactNode } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import BuyFlowSteps from '@/components/layout/BuyFlowSteps';
import type { IOrganizer } from '@/types';

interface LayoutProps {
	children: ReactNode;
	organizer?: IOrganizer;
	organizerName?: string;
	logoUrl?: string | null;
	socialLinks?: Record<string, string>;
	pages?: IOrganizer['pages'];
	cartQuantity?: number;
	cartTotal?: number;
	currency?: string;
	onCartClick?: () => void;
	/** When set, renders the buy-flow step bar (1 seats · 2 checkout · 3 ticket). */
	currentStep?: 1 | 2 | 3;
}

export default function Layout({
	children,
	organizer,
	organizerName,
	logoUrl,
	socialLinks,
	pages,
	cartQuantity,
	cartTotal,
	currency,
	onCartClick,
	currentStep,
}: LayoutProps) {
	const name = organizerName ?? organizer?.name ?? '';
	const logo = logoUrl ?? organizer?.logo_url;
	const links = socialLinks ?? organizer?.social_links;
	const bio = organizer?.bio;
	const legalPages = pages ?? organizer?.pages;

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
			{currentStep && <BuyFlowSteps currentStep={currentStep} />}
			<main className="flex-1">{children}</main>
			<AppFooter
				organizerName={name}
				organizerBio={bio}
				logoUrl={logo}
				socialLinks={links}
				pages={legalPages}
			/>
		</div>
	);
}
