// Geometry coverage for the two seat-producing section shapes this copy never
// executed: a BENT rows section (bend > 0, both curve directions) and a TABLE
// section. seatingGeometry.ts is copied verbatim from besttix under
// GEOMETRY_VERSION 1, so every seat id and coordinate it produces is a cross-repo
// contract — an untested branch is a branch that can drift between the two repos.
//
// Copied verbatim from besttix `src/__tests__/seating-geometry-bend-table.test.ts`
// (only the import path differs). The coordinates are FROZEN literals derived by
// hand from the arc geometry, NOT re-run through the shipped formula — which is
// what makes them a check of THIS copy's math rather than of itself.
//
// Deliberately does not touch fixtures/seating-parity.fixture.ts: that file is
// duplicated in besttix and extending it needs a paired PR there.
import { describe, it, expect } from 'vitest';
import {
	computeAllSeats,
	computeSeats,
	rectSectionBounds,
	RectSection,
	RowsSection,
	StageSection,
	TableSection,
	VenueShapeSection,
} from '@/lib/seatingGeometry';

// 5 seats × pitch 10 ⇒ front row is 40 wide; bent over 60° that fixes the front
// row's radius at R0 = 40 / (π/3) = 38.197186…, one seat every 15°, rows 20 apart.
const bentBase: RowsSection = {
	type: 'rows',
	key: 'tribuna',
	label: 'Tribuna',
	category: 'standard',
	x: 200,
	y: 300,
	rows: 2,
	seatsPerRow: 5,
	seatSize: 10,
	rowGap: 10,
	seatGap: 0,
	rotation: 0,
	bend: 60,
	rowLabel: 'alpha',
	seatStart: 1,
};

// [id, x, y, labelRotation]
type ExpectedSeat = [string, number, number, number];

const CONCAVE: ExpectedSeat[] = [
	['tribuna-A-1', 180.901407, 305.117453, -30],
	['tribuna-A-2', 190.113841, 301.301538, -15],
	['tribuna-A-3', 200, 300, 0],
	['tribuna-A-4', 209.886159, 301.301538, 15],
	['tribuna-A-5', 219.098593, 305.117453, 30],
	['tribuna-B-1', 170.901407, 287.796945, -30],
	['tribuna-B-2', 184.937460, 281.983021, -15],
	['tribuna-B-3', 200, 280, 0],
	['tribuna-B-4', 215.062540, 281.983021, 15],
	['tribuna-B-5', 229.098593, 287.796945, 30],
];

const CONVEX: ExpectedSeat[] = [
	['tribuna-A-1', 180.901407, 294.882547, 30],
	['tribuna-A-2', 190.113841, 298.698462, 15],
	['tribuna-A-3', 200, 300, 0],
	['tribuna-A-4', 209.886159, 298.698462, -15],
	['tribuna-A-5', 219.098593, 294.882547, -30],
	['tribuna-B-1', 190.901407, 277.562039, 30],
	['tribuna-B-2', 195.290222, 279.379946, 15],
	['tribuna-B-3', 200, 280, 0],
	['tribuna-B-4', 204.709778, 279.379946, -15],
	['tribuna-B-5', 209.098593, 277.562039, -30],
];

function expectSeats(seats: ReturnType<typeof computeSeats>, expected: ExpectedSeat[]) {
	expect(seats.map((s) => s.id)).toEqual(expected.map((e) => e[0]));
	expected.forEach(([id, x, y, rot], i) => {
		expect(seats[i].id).toBe(id);
		expect(seats[i].x).toBeCloseTo(x, 5);
		expect(seats[i].y).toBeCloseTo(y, 5);
		expect(seats[i].rotation).toBeCloseTo(rot, 5);
	});
}

describe('computeRowsSeats — bent rows (bend > 0)', () => {
	it('concave: seats fan around a centre BEHIND the front row', () => {
		expectSeats(computeSeats(bentBase), CONCAVE);
	});

	it('convex: same front row, back rows wrap the other way', () => {
		expectSeats(computeSeats({ ...bentBase, curveDir: 'convex' }), CONVEX);
	});

	it('the two curve directions differ only from row 1 onward', () => {
		const concave = computeSeats(bentBase);
		const convex = computeSeats({ ...bentBase, curveDir: 'convex' });

		// Row A shares its x (radius R0 either way) and mirrors its y about the anchor.
		for (let c = 0; c < 5; c++) {
			expect(convex[c].x).toBeCloseTo(concave[c].x, 5);
			expect(convex[c].y - bentBase.y).toBeCloseTo(bentBase.y - concave[c].y, 5);
			expect(convex[c].rotation).toBeCloseTo(-concave[c].rotation, 5);
		}

		// Row B: both centres land 20 (one rowStep) from the anchor (index 7 = B-3),
		// but a concave row's ends fall back toward the anchor while a convex row's
		// ends push further away from it.
		expect(concave[7].y).toBeCloseTo(280, 5);
		expect(convex[7].y).toBeCloseTo(280, 5);
		expect(concave[6].y).toBeCloseTo(281.983021, 5);
		expect(convex[6].y).toBeCloseTo(279.379946, 5);
		expect(concave[5].y - concave[7].y).toBeGreaterThan(0); // ends nearer the anchor
		expect(convex[5].y - convex[7].y).toBeLessThan(0); // ends beyond the centre
	});

	it('every row is symmetric about the section centre line', () => {
		const seats = computeSeats(bentBase);
		for (const row of [0, 5]) {
			for (let c = 0; c < 2; c++) {
				const left = seats[row + c];
				const right = seats[row + 4 - c];
				expect(left.x - bentBase.x).toBeCloseTo(bentBase.x - right.x, 5);
				expect(left.y).toBeCloseTo(right.y, 5);
				expect(left.rotation).toBeCloseTo(-right.rotation, 5);
			}
			expect(seats[row + 2].x).toBeCloseTo(bentBase.x, 5);
			expect(seats[row + 2].rotation).toBeCloseTo(0, 5);
		}
	});

	it('ids are unique and shaped "<key>-<row>-<num>"', () => {
		const ids = computeSeats(bentBase).map((s) => s.id);
		expect(ids).toHaveLength(10);
		expect(new Set(ids).size).toBe(ids.length);
		for (const id of ids) expect(id).toMatch(/^tribuna-[AB]-[1-5]$/);
	});

	it('a negative bend sweeps the same arc as its positive twin', () => {
		expectSeats(computeSeats({ ...bentBase, bend: -60 }), CONCAVE);
	});

	it('rotation turns the whole block and the seat labels with it', () => {
		const seats = computeSeats({ ...bentBase, rotation: 90 });
		// Local (−19.098593, 5.117453) rotated 90° ⇒ (−5.117453, −19.098593) off the anchor.
		expect(seats[0].x).toBeCloseTo(194.882547, 5);
		expect(seats[0].y).toBeCloseTo(280.901407, 5);
		expect(seats[0].rotation).toBeCloseTo(60, 5); // −30 label + 90 block
		expect(seats[2].x).toBeCloseTo(200, 5);
		expect(seats[2].y).toBeCloseTo(300, 5);
		expect(seats[2].rotation).toBeCloseTo(90, 5);
	});

	it('skipped seats drop out of a bent row without shifting the others', () => {
		const seats = computeSeats({ ...bentBase, skip: ['A-2', 'B-5'] });
		expect(seats.map((s) => s.id)).toEqual([
			'tribuna-A-1',
			'tribuna-A-3',
			'tribuna-A-4',
			'tribuna-A-5',
			'tribuna-B-1',
			'tribuna-B-2',
			'tribuna-B-3',
			'tribuna-B-4',
		]);
		expect(seats[1].x).toBeCloseTo(200, 5); // A-3 still on the centre line
		expect(seats[1].y).toBeCloseTo(300, 5);
	});

	it('a bend under the 1e-4 rad threshold stays a straight row', () => {
		// 0.001° ≈ 1.75e-5 rad — below the threshold, so seats sit on a flat line.
		const seats = computeSeats({ ...bentBase, bend: 0.001 });
		expect(seats.map((s) => s.y)).toEqual([300, 300, 300, 300, 300, 320, 320, 320, 320, 320]);
		expect(seats.map((s) => s.x)).toEqual([180, 190, 200, 210, 220, 180, 190, 200, 210, 220]);
		expect(seats.every((s) => s.rotation === 0)).toBe(true);
	});
});

// Round table: seats sit seatSize/2 + 5 outside the rim, i.e. on a circle of
// radius 30 + 10 = 40 around (100, 50), one every 360/4 degrees from startAngle.
const roundTable: TableSection = {
	type: 'table',
	key: 'masa1',
	label: 'Masa 1',
	category: 'vip',
	cx: 100,
	cy: 50,
	rx: 30,
	ry: 30,
	seats: 4,
	startAngle: 0,
	clockwise: true,
	seatSize: 10,
	seatStart: 1,
};

describe('computeTableSeats', () => {
	it('clockwise: seats walk the rim at increasing angles', () => {
		expectSeats(computeSeats(roundTable), [
			['masa1-T-1', 140, 50, 90],
			['masa1-T-2', 100, 90, 180],
			['masa1-T-3', 60, 50, 270],
			['masa1-T-4', 100, 10, 360],
		]);
	});

	it('counter-clockwise: same rim, walked the other way', () => {
		expectSeats(computeSeats({ ...roundTable, clockwise: false }), [
			['masa1-T-1', 140, 50, 90],
			['masa1-T-2', 100, 10, 0],
			['masa1-T-3', 60, 50, -90],
			['masa1-T-4', 100, 90, -180],
		]);
	});

	it('both directions cover the same set of positions', () => {
		const key = (s: { x: number; y: number }) => `${s.x.toFixed(6)}/${s.y.toFixed(6)}`;
		const cw = computeSeats(roundTable).map(key).sort();
		const ccw = computeSeats({ ...roundTable, clockwise: false }).map(key).sort();
		expect(ccw).toEqual(cw);
	});

	it('an elliptical table offsets each radius on its own axis', () => {
		expectSeats(
			computeSeats({ ...roundTable, rx: 40, ry: 20, startAngle: 90, seatStart: 11 }),
			[
				['masa1-T-11', 100, 80, 180],
				['masa1-T-12', 50, 50, 270],
				['masa1-T-13', 100, 20, 360],
				['masa1-T-14', 150, 50, 450],
			],
		);
	});

	it('seatStart drives the numbering, ids stay unique on the "T" row', () => {
		const seats = computeSeats({ ...roundTable, seats: 8, seatStart: 101 });
		const ids = seats.map((s) => s.id);
		expect(ids).toHaveLength(8);
		expect(new Set(ids).size).toBe(8);
		expect(ids[0]).toBe('masa1-T-101');
		expect(ids[7]).toBe('masa1-T-108');
		for (const s of seats) {
			expect(s.row).toBe('T');
			expect(s.sectionKey).toBe('masa1');
			expect(s.category).toBe('vip');
		}
	});

	it('a table declared with zero seats still yields one', () => {
		const seats = computeSeats({ ...roundTable, seats: 0 });
		expect(seats.map((s) => s.id)).toEqual(['masa1-T-1']);
		expect(seats[0].x).toBeCloseTo(140, 6);
		expect(seats[0].y).toBeCloseTo(50, 6);
	});

	it('computeAllSeats dispatches the table case alongside other sections', () => {
		const ids = computeAllSeats([bentBase, roundTable]).map((s) => s.id);
		expect(ids).toHaveLength(14);
		expect(ids.slice(10)).toEqual(['masa1-T-1', 'masa1-T-2', 'masa1-T-3', 'masa1-T-4']);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('the seatless section types contribute nothing to the mix', () => {
		const stage: StageSection = {
			type: 'stage',
			key: 'scena',
			label: 'Scena',
			x: 100,
			y: 0,
			width: 120,
			height: 30,
			rotation: 0,
		};
		const venue: VenueShapeSection = { type: 'venue-shape', key: 'arena', label: 'Arena', cx: 100, cy: 50, radius: 200 };
		expect(computeSeats(stage)).toEqual([]);
		expect(computeSeats(venue)).toEqual([]);
		expect(computeAllSeats([stage, roundTable, venue]).map((s) => s.id)).toEqual([
			'masa1-T-1',
			'masa1-T-2',
			'masa1-T-3',
			'masa1-T-4',
		]);
	});
});

describe('rectSectionBounds', () => {
	const rect: RectSection = {
		type: 'rect',
		key: 'parter',
		label: 'Parter',
		category: 'standard',
		x: 0,
		y: 0,
		rotation: 0,
		rows: 4,
		seatsPerRow: 10,
		seatSize: 20,
		rowGap: 6,
		seatGap: 4,
		rowLabel: 'alpha',
		seatStart: 1,
	};

	it('spans the seats without the trailing gap', () => {
		// 10 seats of 20 + 9 gaps of 4 = 236; 4 rows of 20 + 3 gaps of 6 = 98.
		expect(rectSectionBounds(rect)).toEqual({ w: 236, h: 98 });
	});

	it('a single row/column collapses to one seat size', () => {
		expect(rectSectionBounds({ ...rect, rows: 1, seatsPerRow: 1 })).toEqual({ w: 20, h: 20 });
	});
});
