import type { ReactNode } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import BuyFlowSteps from '@/components/layout/BuyFlowSteps';
import { useOrganizer } from '@/contexts/OrganizerContext';
import { useLayout } from '@/contexts/LayoutContext';

interface LayoutProps {
	children: ReactNode;
}

/**
 * Persistent site chrome. Rendered once by `_app.tsx` via the `getLayout`
 * pattern, so the navbar/logo/footer stay mounted across SPA navigations.
 * Organizer comes from context; per-page state (cart pill, buy-flow step
 * bar) is pushed via `useHeaderCart` / `useBuyFlowStep`.
 */
export default function Layout({ children }: LayoutProps) {
	const { organizer } = useOrganizer();
	const { cart, currentStep } = useLayout();

	const name = organizer?.name ?? '';
	const logo = organizer?.logo_url;
	const links = organizer?.social_links;
	const bio = organizer?.bio;
	const legalPages = organizer?.pages;

	return (
		<div className="flex min-h-screen flex-col">
			<AppHeader
				organizerName={name}
				logoUrl={logo}
				cartQuantity={cart?.cartQuantity}
				cartTotal={cart?.cartTotal}
				currency={cart?.currency}
				onCartClick={cart?.onCartClick}
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
