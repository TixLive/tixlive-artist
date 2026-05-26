import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface CartHeader {
	cartQuantity: number;
	cartTotal: number;
	currency: string;
	onCartClick?: () => void;
}

interface LayoutCtx {
	cart: CartHeader | null;
	currentStep: 1 | 2 | 3 | null;
	setCart: (c: CartHeader | null) => void;
	setCurrentStep: (s: 1 | 2 | 3 | null) => void;
}

const LayoutContext = createContext<LayoutCtx>({
	cart: null,
	currentStep: null,
	setCart: () => {},
	setCurrentStep: () => {},
});

export function LayoutProvider({ children }: { children: ReactNode }) {
	const [cart, setCart] = useState<CartHeader | null>(null);
	const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | null>(null);
	return (
		<LayoutContext.Provider value={{ cart, currentStep, setCart, setCurrentStep }}>{children}</LayoutContext.Provider>
	);
}

export function useLayout() {
	return useContext(LayoutContext);
}

/** Sets cart info in the persistent header while mounted; clears on unmount. */
export function useHeaderCart(cart: CartHeader | null) {
	const { setCart } = useLayout();
	useEffect(() => {
		setCart(cart);
		return () => setCart(null);
	}, [cart, setCart]);
}

/** Sets the buy-flow step bar while mounted; clears on unmount. */
export function useBuyFlowStep(step: 1 | 2 | 3 | null) {
	const { setCurrentStep } = useLayout();
	useEffect(() => {
		setCurrentStep(step);
		return () => setCurrentStep(null);
	}, [step, setCurrentStep]);
}
