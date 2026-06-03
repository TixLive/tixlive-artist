import type { ReactNode } from 'react';
import AppHeader from '@/components/layout/AppHeader';
import AppFooter from '@/components/layout/AppFooter';
import BuyFlowSteps from '@/components/layout/BuyFlowSteps';
import { useLayout } from '@/contexts/LayoutContext';

interface LayoutProps {
	children: ReactNode;
}

/**
 * Persistent site chrome. Rendered once by `_app.tsx` via the `getLayout`
 * pattern, so the navbar/logo/footer stay mounted across SPA navigations.
 * The header and footer read organizer data from context directly; per-page
 * state (cart pill, buy-flow step bar) is pushed via `useHeaderCart` / `useBuyFlowStep`.
 */
export default function Layout({ children }: LayoutProps) {
	const { currentStep } = useLayout();

	return (
		<div className="flex min-h-screen flex-col">
			<AppHeader />
			{currentStep && <BuyFlowSteps currentStep={currentStep} />}
			<main className="flex-1">{children}</main>
			<AppFooter />
		</div>
	);
}
