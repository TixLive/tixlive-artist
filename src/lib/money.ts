// Buyer-facing money rounding for checkout. This MUST stay in lockstep with the besttix
// server util src/utils/money.ts (round2): the buyer has to be charged the cent that was
// displayed here. Cross-repo parity contract — change both sides together.

/**
 * Round a monetary amount to 2 decimal places (cents), breaking half-cent ties upward.
 *
 * The naive `Math.round(n * 100) / 100` loses accounting ties, because `n * 100` is a
 * binary multiplication: an amount the price list holds as `0.145` reaches `Math.round`
 * as `14.499999999999998` and rounds DOWN to `0.14`. That is the RO timbru on a 14.50 RON
 * base at the 1% Crucea Roșie rate (and on 7.25 @ 2%, and on 2.90 @ 5%) — a bani the
 * server now charges and the storefront would otherwise fail to print.
 *
 * The tie is therefore read off `String(n)` — the shortest decimal that round-trips to the
 * same double, i.e. the number as the price list actually holds it — rather than off a
 * binary product that can only approximate it. Digits past the cent above one half round
 * the magnitude up, below one half round it down, exactly one half goes up.
 *
 * Only the tie itself moves: a value genuinely below the boundary keeps its cent,
 * including the `15.014999999999999` a percentage discount produces (an ULP below the
 * half, reproduced identically by both repos and pinned by the besttix parity suite).
 */
export const round2 = (n: number): number => {
	if (!Number.isFinite(n)) return n;
	const s = String(n);
	const dot = s.indexOf('.');
	// Nothing to round (an integer), or a magnitude JS prints in exponential form: below
	// 1e-6 it rounds to zero and at 1e21 it is nowhere near a cent boundary, so the binary
	// scaling is already exact for both.
	if (dot < 0 || s.includes('e')) return Math.round(n * 100) / 100;

	const negative = s.charCodeAt(0) === 45; /* '-' */
	const cents = Number(s.slice(negative ? 1 : 0, dot) + s.slice(dot + 1, dot + 3).padEnd(2, '0'));
	// Digits past the cent, compared against one half. The shortest decimal spelling never
	// carries trailing zeros, so comparing the digit strings is comparing the fractions.
	const rest = s.slice(dot + 3);
	const roundUp = rest > '5' || (rest === '5' && !negative);
	const rounded = roundUp ? cents + 1 : cents;
	return (negative ? -rounded : rounded) / 100;
};
