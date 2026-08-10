import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';
import { describe, it, expect } from 'vitest';

/**
 * Parity contract with the besttix server (src/tools/generateTicketHash.ts).
 *
 * `ITicket.qr_code_data` is an **opaque, versioned** string. This site must render it
 * verbatim — never parse it, never validate it, never truncate it. Only the scanner
 * holds the ticket secret, so any client-side check here would be both wrong and
 * pointless.
 *
 * besttix currently issues the **v2** payload:
 *
 *     v2.<32-hex-signature><order_ticket.id>__<slug>[__<seat_id>]
 *
 * a ~30-character growth over the unversioned `<8-hex><value>` codes that are still in
 * circulation and still scan. The only thing that growth can break on our side is the QR
 * itself: a longer payload needs a higher QR version, and at some length the code stops
 * fitting the size/error-correction the ticket view renders it at. These tests pin that.
 */

/** The longest realistic payload: v2 envelope + a seated ticket with a long tier slug. */
const V2_SEATED = `v2.${'a'.repeat(32)}481923__premium-parter-vip__parter-rand-a-12`;
/** An unversioned code, still printed on tickets issued before the v2 switch. */
const V1_SEATED = `ab12cd34481923__premium-parter-vip__parter-rand-a-12`;

/** How TicketDetailView renders the code — keep in sync with that component. */
const RENDER = { size: 224, level: 'M' } as const;

function renderQR(value: string): string {
	return renderToStaticMarkup(createElement(QRCodeSVG, { value, ...RENDER }));
}

/** Modules per side of the rendered code — qrcode.react writes it as the SVG viewBox. */
function moduleCount(value: string): number {
	const match = renderQR(value).match(/viewBox="0 0 (\d+) \d+"/);
	if (!match) {
		throw new Error('QRCodeSVG did not render a viewBox');
	}
	return Number(match[1]);
}

describe('qr_code_data — parity with besttix', () => {
	it('renders the current v2 payload at the size/level the ticket view uses', () => {
		const svg = renderQR(V2_SEATED);
		expect(svg).toContain('<svg');
		expect(svg).toContain('viewBox');
	});

	it('still renders an unversioned payload (tickets issued before the v2 switch)', () => {
		expect(renderQR(V1_SEATED)).toContain('<svg');
	});

	it('keeps the code coarse enough for a phone camera to read off a screen', () => {
		// The only real risk of a longer payload: more modules in the same 224px box. A
		// seated v2 code lands on QR version 5 (37×37) → ~6 px per module. Below ~5 px the
		// code starts failing on dim or low-resolution screens, so a future format bump
		// must either stay under this or raise the rendered size.
		const modules = moduleCount(V2_SEATED);
		expect(modules).toBeLessThanOrEqual(37);
		expect(RENDER.size / modules).toBeGreaterThanOrEqual(5);
		// The unversioned codes still in circulation are strictly smaller.
		expect(moduleCount(V1_SEATED)).toBeLessThanOrEqual(modules);
	});

	it('renders the payload verbatim — no parsing, no truncation', () => {
		// The rendered modules must differ for two codes that share their first 8 chars:
		// proof we hand the whole string to the encoder rather than a prefix of it.
		const a = renderQR(V2_SEATED);
		const b = renderQR(`${V2_SEATED}9`);
		expect(a).not.toBe(b);
	});
});
