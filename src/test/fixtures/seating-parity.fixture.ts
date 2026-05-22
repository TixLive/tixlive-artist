// ─── Seat-ID parity contract (shared fixture) ───────────────────────────────
//
// This file is duplicated byte-for-byte in BOTH repos:
//   • besttix          src/__tests__/fixtures/seating-parity.fixture.ts
//   • tixlive-artist   src/test/fixtures/seating-parity.fixture.ts
//
// `seating-parity.test.ts` in each repo asserts that the LOCAL copy of
// `computeAllSeats` produces exactly `expectedSeatIds` (in order) and that the
// LOCAL `GEOMETRY_VERSION` equals `geometryVersion`. If anyone changes the
// seat-ID-producing geometry math in one repo without updating the other, that
// repo's parity test goes red. The runtime `geometry_version` guard (shipped in
// the public seating payload) catches the remaining case: two repos deploying
// different—but-each-internally-consistent—versions.
//
// `sections` deliberately exercises every seat-producing section type
// (rect, rect-rotated, arc, curved, flat) plus a `ga` zone that yields no seats.

import type { Section } from '@/lib/seatingGeometry';

export const geometryVersion = 1;

export const sections: Section[] = [
	{
		type: 'rect',
		key: 'parter',
		label: 'Parter',
		category: 'stalls',
		x: 0,
		y: 0,
		rotation: 0,
		rows: 3,
		seatsPerRow: 5,
		seatSize: 16,
		rowGap: 8,
		seatGap: 6,
		rowLabel: 'alpha',
		seatStart: 1,
	},
	{
		type: 'rect',
		key: 'balcon',
		label: 'Balcon',
		category: 'balcony',
		x: 120,
		y: 240,
		rotation: 15,
		rows: 2,
		seatsPerRow: 4,
		seatSize: 16,
		rowGap: 8,
		seatGap: 6,
		rowLabel: 'alpha',
		seatStart: 1,
	},
	{
		type: 'arc',
		key: 'amfi',
		label: 'Amfiteatru',
		category: 'amphitheatre',
		cx: 200,
		cy: 400,
		innerRadius: 100,
		outerRadius: 140,
		startAngle: 200,
		endAngle: 340,
		rows: 2,
		seatSize: 16,
		seatSpacing: 6,
		rowLabel: 'alpha',
		seatStart: 1,
	},
	{
		type: 'curved',
		key: 'loja',
		label: 'Loja',
		category: 'boxes',
		cx: 300,
		cy: 600,
		innerRadius: 250,
		rows: 2,
		seatsPerRow: 6,
		seatSize: 14,
		rowGap: 8,
		seatGap: 5,
		arcSpan: 60,
		centerAngle: 270,
		rowLabel: 'alpha',
		seatStart: 1,
	},
	{
		type: 'flat',
		key: 'vip',
		label: 'VIP',
		category: 'vip',
		x: 400,
		y: 50,
		seatSize: 18,
		seats: [
			{ localX: 0, localY: 0, row: 'A', num: 1 },
			{ localX: 24, localY: 0, row: 'A', num: 2 },
			{ localX: 0, localY: 24, row: 'B', num: 1 },
		],
	},
	{
		type: 'ga',
		key: 'standing',
		label: 'Standing',
		category: 'ga',
		x: 500,
		y: 500,
		width: 100,
		height: 80,
		capacity: 50,
	},
];

// Frozen contract — regenerated only with an intentional GEOMETRY_VERSION bump.
// (Produced by computeAllSeats(sections); see comment block above.)
export const expectedSeatIds: string[] = [
	'parter-A-1', 'parter-A-2', 'parter-A-3', 'parter-A-4', 'parter-A-5',
	'parter-B-1', 'parter-B-2', 'parter-B-3', 'parter-B-4', 'parter-B-5',
	'parter-C-1', 'parter-C-2', 'parter-C-3', 'parter-C-4', 'parter-C-5',
	'balcon-A-1', 'balcon-A-2', 'balcon-A-3', 'balcon-A-4',
	'balcon-B-1', 'balcon-B-2', 'balcon-B-3', 'balcon-B-4',
	'amfi-A-1', 'amfi-A-2', 'amfi-A-3', 'amfi-A-4', 'amfi-A-5', 'amfi-A-6',
	'amfi-A-7', 'amfi-A-8', 'amfi-A-9', 'amfi-A-10', 'amfi-A-11',
	'amfi-B-1', 'amfi-B-2', 'amfi-B-3', 'amfi-B-4', 'amfi-B-5', 'amfi-B-6',
	'amfi-B-7', 'amfi-B-8', 'amfi-B-9', 'amfi-B-10', 'amfi-B-11', 'amfi-B-12',
	'amfi-B-13', 'amfi-B-14', 'amfi-B-15',
	'loja-A-1', 'loja-A-2', 'loja-A-3', 'loja-A-4', 'loja-A-5', 'loja-A-6',
	'loja-B-1', 'loja-B-2', 'loja-B-3', 'loja-B-4', 'loja-B-5', 'loja-B-6',
	'vip-A-1', 'vip-A-2', 'vip-B-1',
];
