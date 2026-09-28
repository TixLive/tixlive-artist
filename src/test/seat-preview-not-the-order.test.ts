// The auto-allocate seat chart is a PREVIEW, and a preview may never cancel the order
// (T3654, ported from tixlive-whitelabel T3488/PR#94).
//
// With `auto_allocate_seats` on, the seat page asks besttix for a suggestion purely to draw
// it: `handleContinue` submits the buyer's own category cart plus the bundles with
// `auto_allocate: '1'`, checkout then omits `selected_seats`, and besttix allocates the seats
// inside its own transaction. Yet the Continue button used to read
// `isSelectionValid(selected.size)` — the preview — so a `suggestSeats()` call that threw on a
// transient network hiccup, or legitimately came back with nothing, left the chart empty AND
// the button disabled. In this mode `handleSeatToggle` refuses every manual add, so the buyer
// had no way back: an empty map, no message, and — on mobile — no Continue button at all (the
// empty-selection dock branch renders only a panning hint).
//
// There is no DOM testing library in this repo, so these are source-grep policy tests — but
// each one stands in for that dead end returning:
//   · `complete` reading the preview again -> the same permanent lockout;
//   · `orderedTickets`/`orderedBundles` derived from `selected` -> ditto, one step removed;
//   · the mobile dock keyed on `selected.size` alone -> no Continue button at all on a phone;
//   · the summary card calling that order "empty" -> no total, and a contradictory screen;
//   · the copy gone missing -> the silent empty map is back.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const selection = fs.readFileSync(
	path.resolve(__dirname, '../components/seating/SeatSelection.tsx'),
	'utf8'
);
const seatsPage = fs.readFileSync(
	path.resolve(__dirname, '../pages/events/[slug]/seats.tsx'),
	'utf8'
);

describe('the seat preview does not gate the order', () => {
	it('lets Continue follow the source order in auto-allocate mode, not the preview', () => {
		expect(selection).toMatch(
			/const complete = isSelectionValid\(readOnly \? orderedTickets \+ orderedBundles : selected\.size\);/
		);
		// The interactive half is unchanged: there the seats ARE the order.
		expect(selection).not.toMatch(/const complete = isSelectionValid\(selected\.size\);/);
	});

	it('counts the ordered units off the props, never off the chart selection', () => {
		expect(selection).toMatch(
			/const orderedTickets = \(originalCart \?\? \[\]\)\.reduce\(\(s, c\) => s \+ c\.quantity, 0\);/
		);
		expect(selection).toMatch(
			/const orderedBundles = \(bundleLines \?\? \[\]\)\.reduce\(\(s, b\) => s \+ b\.quantity, 0\);/
		);
		// A count taken from `selected` would re-tie the order to the preview.
		expect(selection).not.toMatch(/const ordered(Tickets|Bundles) =[^\n]*\bselected\b/);
	});

	it('spells the degraded state once, and only for auto-allocate', () => {
		expect(selection).toMatch(/const previewMissing = readOnly && complete && selected\.size === 0;/);
	});

	it('still submits the category cart + bundles, which is why the preview may be empty', () => {
		// If this ever stops holding, the preview IS the order and the guard above is wrong.
		expect(selection).toMatch(/readOnly && originalCart \? originalCart : derivedCart/);
		expect(selection).toMatch(/\.\.\.\(readOnly && \{ auto_allocate: '1' \}\)/);
	});

	it('keeps a way forward in the mobile dock when there is nothing to list', () => {
		const start = selection.indexOf('{selected.size === 0 ? (');
		expect(start, 'the mobile dock still branches on an empty selection').toBeGreaterThan(-1);
		const end = selection.indexOf('\n\t\t\t\t) : (', start);
		expect(end, 'the empty dock still has a non-empty sibling').toBeGreaterThan(start);
		const dock = selection.slice(start, end);
		expect(dock).toMatch(/\{previewMissing \? \(/);
		expect(dock).toMatch(/onClick=\{handleContinue\}/);
		// The panning hint stays the default for an interactive chart with no seats picked.
		expect(dock).toMatch(/\{t\('seating\.canvas_hint'\)\}/);
	});

	it('does not call an auto-allocate order empty just because no seat is listed', () => {
		expect(selection).toMatch(
			/if \(selectedCount === 0 && !hasBundleLines && !previewMissing\) \{/
		);
	});

	it('says why the map is empty instead of leaving the buyer to guess', () => {
		// The three surfaces that speak for this state: the desktop summary card, the mobile
		// dock, and the live region a screen reader hears.
		expect(selection.match(/t\('seating\.preview_unavailable'\)/g) ?? []).toHaveLength(3);
	});

	it('tells a screen reader the same thing the screen says', () => {
		// `no_seats_yet` reads as "there is no way forward", which is exactly wrong here.
		expect(selection).toMatch(/const liveMessage = previewMissing\n\t\t\? t\('seating\.preview_unavailable'\)/);
	});

	it('hands the seat page the source order the fallback reads', () => {
		expect(seatsPage).toMatch(/readOnly=\{state\.autoAllocate\}/);
		expect(seatsPage).toMatch(/originalCart=\{state\.originalCart\}/);
	});
});

describe('the degraded-state copy ships in every locale', () => {
	const locales = fs.readdirSync(path.resolve(__dirname, '../../public/locales')).sort();

	it.each(locales)('%s has seating.preview_unavailable', (locale) => {
		const dict = JSON.parse(
			fs.readFileSync(path.resolve(__dirname, `../../public/locales/${locale}/common.json`), 'utf8')
		);
		expect(typeof dict.seating?.preview_unavailable).toBe('string');
		expect(dict.seating.preview_unavailable.trim().length).toBeGreaterThan(0);
	});
});
