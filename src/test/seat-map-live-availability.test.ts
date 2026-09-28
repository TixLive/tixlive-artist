// The seat map used to be one snapshot: `fetchSeating` ran once in the mount effect of
// `events/[slug]/seats.tsx` and `SeatSelection` painted `booked` from it for as long as the
// buyer stayed. Someone studying the hall for a few minutes saw the availability of a few
// minutes ago — a seat sold in between stayed drawn as free, could still be picked, and the
// conflict only surfaced at Continue (the one-shot recheck there, T3603, covers only the
// hand-off to checkout, not the time spent looking at the map). This is the map half (T3653),
// same gap tixlive-whitelabel closed separately as T3526.
//
// @tixlive-agent carries no DOM testing library, so — same shape as seat-selection.test.ts's
// pure-function coverage — this greps the actual sources rather than rendering the components.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8');

describe('useLiveBookedSeats', () => {
	const src = read('src/hooks/useLiveBookedSeats.ts');

	it('beats on a 30s interval while the map is mounted', () => {
		expect(src).toContain('SEAT_MAP_POLL_INTERVAL_MS = 30_000');
		expect(src).toContain('refetchInterval: SEAT_MAP_POLL_INTERVAL_MS');
	});

	it('hands back availability alone, never the refetched geometry', () => {
		expect(src).toContain('return data?.booked;');
		expect(src).not.toMatch(/return data;/);
	});

	it('seeds itself from the snapshot the page already fetched', () => {
		// Otherwise entering the map costs two reads of the same hall.
		expect(src).toContain('initialData: initial');
	});
});

describe('useGetSeating', () => {
	const src = read('src/queries/seating/useGetSeating.ts');

	it('supports a timed refetch and a pre-seeded cache', () => {
		expect(src).toMatch(/refetchInterval\?:\s*number\s*\|\s*false/);
		expect(src).toMatch(/initialData\?:\s*ISeatingResponse/);
	});
});

describe('the seats page', () => {
	const page = read('src/pages/events/[slug]/seats.tsx');

	it('re-reads the hall while the buyer is looking at it', () => {
		expect(page).toContain("from '@/hooks/useLiveBookedSeats'");
		expect(page).toMatch(/const liveBooked = useLiveBookedSeats\(\{[\s\S]*?\}\);/);
		expect(page).toMatch(/liveBooked=\{liveBooked\}/);
	});
});

describe('SeatSelection', () => {
	const src = read('src/components/seating/SeatSelection.tsx');
	const recheck = src.slice(src.indexOf('// The beat that refreshes `liveBooked`'));

	it('paints the fresh availability over the frozen geometry', () => {
		// `sections` (the geometry) stays the mount snapshot on purpose: the viewer re-fits
		// the viewport whenever the content bounds it derives from `sections` change.
		expect(src).toMatch(
			/const bookedSet = useMemo\(\(\) => new Set\(liveBooked \?\? seating\.booked\), \[liveBooked, seating\.booked\]\);/
		);
	});

	it('drops a picked seat that has just been sold, and keeps the rest', () => {
		expect(recheck.length).toBeGreaterThan(0);
		expect(recheck).toMatch(/const lost = \[\.\.\.selected\]\.filter\(\(id\) => bookedSet\.has\(id\)\);/);
		// Only the lost ids leave the selection — a beat landing while the buyer drags the
		// map must never cost them a seat that is still free.
		expect(recheck).toMatch(/const next = new Set\(selected\);\s*\n\s*for \(const id of lost\) next\.delete\(id\);/);
		expect(recheck).toMatch(/setSelected\(next\);/);
	});

	it('leaves an auto-allocate preview alone', () => {
		// The preview is what besttix will hand out in the order transaction, not a claim
		// of the buyer's, and it is read-only — there is nothing for them to fix.
		expect(recheck).toMatch(/if \(readOnly\) return;[\s\S]*?const lost = \[\.\.\.selected\]/);
	});

	it('tells the buyer explicitly, on screen and to a screen reader', () => {
		expect(recheck).toMatch(/showToast\(\{ title: t\('checkout\.error_seat_taken'\), color: 'warning' \}\);/);
		expect(src).toMatch(/const liveMessage = seatsTaken/);
		expect(src).toContain("`${t('checkout.error_seat_taken')} ${selectionMessage}`");
	});

	it('clears the taken flag as soon as the buyer acts on the selection themselves', () => {
		expect(src).toMatch(/setSelected\(r\.next\);\s*\n\s*setSeatsTaken\(false\);/);
		expect(src).toMatch(/next\.delete\(seatId\);\s*\n\s*return next;\s*\n\s*\}\);\s*\n\s*setSeatsTaken\(false\);/);
	});
});
