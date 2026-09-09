// SuperStage — seating chart geometry engine
// All seat coordinates are computed from parametric section definitions.
// Nothing is stored in the DB — only the section params are persisted.
//
// ⚠️ COPIED VERBATIM from besttix `src/lib/seatingGeometry.ts`. This is the
// white-label half of the seat-ID parity contract: the two repos MUST compute
// byte-identical seat IDs. `seating-parity.fixture.ts` + `seating-parity.test.ts`
// fail CI in either repo if this diverges, and `GEOMETRY_VERSION` (shipped in the
// public seating payload) guards against the two repos deploying skewed versions
// at runtime. Do NOT edit one copy without the other.

// Bump whenever the seat-ID-producing math changes. Shipped in the public seating
// payload; the white-label viewer copies this module and refuses to render if its
// GEOMETRY_VERSION differs (deploy-skew guard — a green CI parity test does not
// protect against the two repos deploying different geometry versions).
export const GEOMETRY_VERSION = 1;

export type SectionType = 'rows' | 'rect' | 'arc' | 'curved' | 'venue-shape' | 'stage' | 'table' | 'ga' | 'flat';
export type RowLabelType = 'alpha' | 'numeric';

export interface RectSection {
	type: 'rect';
	key: string;
	label: string;
	category: string;
	x: number;
	y: number;
	rotation: number; // degrees
	rows: number;
	seatsPerRow: number;
	seatSize: number;
	rowGap: number;
	seatGap: number;
	rowLabel: RowLabelType;
	seatStart: number;
}

export interface ArcSection {
	type: 'arc';
	key: string;
	label: string;
	category: string;
	cx: number; // arc center X
	cy: number; // arc center Y
	innerRadius: number;
	outerRadius: number;
	startAngle: number; // degrees, 0 = right, clockwise
	endAngle: number;
	rows: number;
	seatSize: number;
	seatSpacing: number; // gap between seats along the arc
	rowLabel: RowLabelType;
	seatStart: number;
	// Optional taper: widens (positive) or narrows (negative) the arc by this many
	// degrees per side per row. Row 0 uses startAngle/endAngle as-is.
	taperAngle?: number;
	// Skip this many degrees at the arc midpoint (e.g. for a Ložha box gap).
	// Applied symmetrically — each side loses centerGapDeg/2.
	centerGapDeg?: number;
}

// ─── Curved section (Seat Rows tool) ─────────────────────────────────────────
// Fixed seatsPerRow across all rows. Rows bend along concentric arcs.
// The arc center (cx, cy) is typically outside/below the visible canvas.
// arcSpan: total arc angle in degrees (same for every row)
// centerAngle: direction the section faces (270° = up, opening toward top of canvas)
// Snap: when snapped to a VenueShapeSection, cx/cy/innerRadius are auto-computed.
export interface CurvedSection {
	type: 'curved';
	key: string;
	label: string;
	category: string;
	cx: number;
	cy: number;
	innerRadius: number;
	rows: number;
	seatsPerRow: number;
	seatSize: number;
	rowGap: number;
	seatGap: number;       // visual gap between seats (informational; spacing = arcSpan / (seatsPerRow-1))
	arcSpan: number;       // arc angle in degrees (all rows share this span)
	centerAngle: number;   // degrees: direction from arc center to midpoint of innermost row
	rowLabel: RowLabelType;
	seatStart: number;
	venueSnap?: 'off' | 'centre' | 'inside'; // last applied snap mode
}

// ─── Rows section (unified seat-rows block — the primary authoring primitive) ──
// A straight grid of rows×seats that can be BENT into a fan and ROTATED to face a
// focal point (the stage). This mirrors seatmap.pro's "Seat Rows" tool: draw a
// straight block, then bend + rotate it toward the hall.
//
// Geometry: seats are laid out in local space (row 0 = front, nearest the focal
// point), bent so the whole section sweeps `bend` degrees (0 = perfectly straight),
// then the block is rotated by `rotation` degrees about its anchor (x, y) and
// translated into canvas space. With bend > 0 seats fan out and each seat's label
// rotation points along the radius (toward the arc centre / stage).
export interface RowsSection {
	type: 'rows';
	key: string;
	label: string;
	category: string;
	x: number; // anchor = centre of the front row (row 0), in canvas space
	y: number;
	rows: number;
	seatsPerRow: number;
	seatSize: number;
	rowGap: number; // radial gap between rows
	seatGap: number; // base gap between seats (straight); along-arc when bent
	rotation: number; // degrees, orient the block toward the stage (0 = front faces up / −y)
	bend: number; // total fan sweep in degrees (0 = straight, typical 10–90)
	rowLabel: RowLabelType;
	seatStart: number;
	rowLabelAlign?: 'per-row' | 'aligned'; // label column behaviour for fan sections
	// "row-seat" ids removed in edit-seats mode (e.g. "A-3"). Excluded from output.
	skip?: string[];
	// Optional per-row seat-gap overrides (index = row). Falls back to seatGap.
	rowSpacing?: number[];
	// Curve direction: 'concave' = seats wrap toward the focal point (default,
	// grandstand facing the field); 'convex' = wrap away.
	curveDir?: 'concave' | 'convex';
}

// ─── Venue shape (guide overlay) ─────────────────────────────────────────────
// Not a seating section — renders as a dashed circle to guide section placement.
// Use with CurvedSection.venueSnap to auto-fit sections.
export interface VenueShapeSection {
	type: 'venue-shape';
	key: string;
	label: string;
	cx: number;
	cy: number;
	radius: number;
}

// ─── Table (round / elliptical, seats around the rim) ─────────────────────────
export interface TableSection {
	type: 'table';
	key: string;
	label: string;
	category: string;
	cx: number;
	cy: number;
	rx: number; // table radii (rx === ry ⇒ round; else elliptical)
	ry: number;
	seats: number;
	startAngle: number; // degrees, 0 = right
	clockwise: boolean;
	seatSize: number;
	seatStart: number;
}

// ─── Stage (orientation reference, no seats) ──────────────────────────────────
export interface StageSection {
	type: 'stage';
	key: string;
	label: string;
	x: number; // centre
	y: number;
	width: number;
	height: number;
	rotation: number; // degrees
}

export interface GaSection {
	type: 'ga';
	key: string;
	label: string;
	category: string;
	x: number;
	y: number;
	width: number;
	height: number;
	capacity: number;
}

export interface FlatSeat {
	localX: number;
	localY: number;
	row: string;
	num: number;
}

// Pre-computed seat positions (used for irregular/imported sections)
export interface FlatSection {
	type: 'flat';
	key: string;
	label: string;
	category: string;
	x: number;
	y: number;
	seatSize: number;
	seats: FlatSeat[];
}

export type Section =
	| RowsSection
	| RectSection
	| ArcSection
	| CurvedSection
	| VenueShapeSection
	| StageSection
	| TableSection
	| GaSection
	| FlatSection;

export interface Seat {
	id: string;       // "parter-A-1"
	x: number;
	y: number;
	rotation: number; // for label orientation
	row: string;
	num: number;
	sectionKey: string;
	category: string;
}

// ─── Row label helpers ────────────────────────────────────────────────────────

function rowLabel(index: number, type: RowLabelType): string {
	if (type === 'numeric') return String(index + 1);
	// alpha: A, B, ..., Z, AA, AB, ...
	let label = '';
	let n = index;
	do {
		label = String.fromCharCode(65 + (n % 26)) + label;
		n = Math.floor(n / 26) - 1;
	} while (n >= 0);
	return label;
}

// ─── Rows section (bend + rotate toward stage) ────────────────────────────────

function computeRowsSeats(s: RowsSection): Seat[] {
	const seats: Seat[] = [];
	const rot = (s.rotation * Math.PI) / 180;
	const cosR = Math.cos(rot);
	const sinR = Math.sin(rot);
	const rowStep = s.seatSize + s.rowGap;
	const n = Math.max(s.seatsPerRow, 1);
	const skip = s.skip && s.skip.length ? new Set(s.skip) : null;
	const concave = s.curveDir !== 'convex';

	// Place a local-space point (origin = anchor = centre of front row), then rotate
	// by `rotation` and translate to canvas space. localY grows AWAY from the stage.
	const place = (lx: number, ly: number, faceDeg: number, row: string, num: number, idx: { c: number }) => {
		const x = s.x + lx * cosR - ly * sinR;
		const y = s.y + lx * sinR + ly * cosR;
		seats.push({
			id: `${s.key}-${row}-${num}`,
			x,
			y,
			rotation: faceDeg + s.rotation,
			row,
			num,
			sectionKey: s.key,
			category: s.category,
		});
		idx.c++;
	};

	const bendRad = (Math.abs(s.bend) * Math.PI) / 180;

	for (let r = 0; r < s.rows; r++) {
		const rowName = rowLabel(r, s.rowLabel);
		const gap = (s.rowSpacing && s.rowSpacing[r] != null ? s.rowSpacing[r] : s.seatGap);
		const pitch = s.seatSize + gap;
		const idx = { c: 0 };

		if (bendRad < 1e-4) {
			// Straight row, centred on x.
			const rowW = (n - 1) * pitch;
			for (let c = 0; c < n; c++) {
				const num = s.seatStart + c;
				if (skip && skip.has(`${rowName}-${num}`)) continue;
				const lx = c * pitch - rowW / 2;
				const ly = r * rowStep;
				place(lx, ly, 0, rowName, num, idx);
			}
			continue;
		}

		// Bent row: whole section sweeps `bend` degrees. Row 0's arc length ≈ its
		// straight width, which fixes the base radius; rows fan outward from there.
		const row0W = (n - 1) * pitch;
		const R0 = row0W / bendRad; // radius of the front row's seat arc
		const angStep = bendRad / Math.max(n - 1, 1);
		const sign = concave ? 1 : -1;
		const radius = R0 + r * rowStep * sign;
		for (let c = 0; c < n; c++) {
			const num = s.seatStart + c;
			if (skip && skip.has(`${rowName}-${num}`)) continue;
			const ang = -bendRad / 2 + c * angStep; // 0 at row centre
			// Arc centre sits at (0, R0*sign) below/above the front row; concave = below.
			const lx = radius * Math.sin(ang);
			const ly = sign * (R0 - radius * Math.cos(ang));
			const faceDeg = (ang * 180) / Math.PI; // label points along the radius
			place(lx, ly, concave ? faceDeg : -faceDeg, rowName, num, idx);
		}
	}

	// Aligned row labels: handled at render time by the editor; geometry is unaffected.
	return seats;
}

// ─── Table seats (around the rim) ─────────────────────────────────────────────

function computeTableSeats(s: TableSection): Seat[] {
	const seats: Seat[] = [];
	const n = Math.max(s.seats, 1);
	const dir = s.clockwise ? 1 : -1;
	const off = s.seatSize / 2 + 5;
	for (let i = 0; i < n; i++) {
		const deg = s.startAngle + dir * (i * 360) / n;
		const a = (deg * Math.PI) / 180;
		const x = s.cx + (s.rx + off) * Math.cos(a);
		const y = s.cy + (s.ry + off) * Math.sin(a);
		seats.push({
			id: `${s.key}-T-${s.seatStart + i}`,
			x,
			y,
			rotation: deg + 90, // face the table centre
			row: 'T',
			num: s.seatStart + i,
			sectionKey: s.key,
			category: s.category,
		});
	}
	return seats;
}

// ─── Rectangular section ──────────────────────────────────────────────────────

export function computeRectSeats(s: RectSection): Seat[] {
	const seats: Seat[] = [];
	const rad = (s.rotation * Math.PI) / 180;
	const cos = Math.cos(rad);
	const sin = Math.sin(rad);

	for (let r = 0; r < s.rows; r++) {
		const row = rowLabel(r, s.rowLabel);
		const localY = r * (s.seatSize + s.rowGap);

		for (let c = 0; c < s.seatsPerRow; c++) {
			const localX = c * (s.seatSize + s.seatGap);

			// Apply rotation around section origin
			const x = s.x + localX * cos - localY * sin;
			const y = s.y + localX * sin + localY * cos;

			seats.push({
				id: `${s.key}-${row}-${s.seatStart + c}`,
				x,
				y,
				rotation: s.rotation,
				row,
				num: s.seatStart + c,
				sectionKey: s.key,
				category: s.category,
			});
		}
	}

	return seats;
}

// ─── Arc section ──────────────────────────────────────────────────────────────

export function computeArcSeats(s: ArcSection): Seat[] {
	const seats: Seat[] = [];

	const baseStartRad = (s.startAngle * Math.PI) / 180;
	const baseEndRad   = (s.endAngle   * Math.PI) / 180;
	const taperRad     = ((s.taperAngle ?? 0) * Math.PI) / 180;
	const gapHalfRad   = ((s.centerGapDeg ?? 0) / 2 * Math.PI) / 180;
	const rowSpacing   = (s.outerRadius - s.innerRadius) / Math.max(s.rows - 1, 1);

	for (let r = 0; r < s.rows; r++) {
		const row    = rowLabel(r, s.rowLabel);
		const radius = s.innerRadius + r * rowSpacing;

		// Per-row taper: each successive row widens or narrows by taperAngle° on each side
		const startRad = baseStartRad - r * taperRad;
		const endRad   = baseEndRad   + r * taperRad;
		const midRad   = (startRad + endRad) / 2;

		// Number of seat slots that fit along this arc
		const arcLength  = Math.abs(endRad - startRad) * radius;
		const slotsInRow = Math.max(1, Math.floor(arcLength / (s.seatSize + s.seatSpacing)));
		const angleStep  = (endRad - startRad) / Math.max(slotsInRow - 1, 1);

		let seatNum = s.seatStart;
		for (let c = 0; c < slotsInRow; c++) {
			const angle = startRad + c * angleStep;

			// Skip slots inside the center gap
			if (gapHalfRad > 0 && Math.abs(angle - midRad) < gapHalfRad) continue;

			const x = s.cx + radius * Math.cos(angle);
			const y = s.cy + radius * Math.sin(angle);
			const seatRotation = (angle * 180) / Math.PI + 90;

			seats.push({
				id: `${s.key}-${row}-${seatNum}`,
				x, y,
				rotation: seatRotation,
				row,
				num: seatNum,
				sectionKey: s.key,
				category: s.category,
			});
			seatNum++;
		}
	}

	return seats;
}

// ─── Curved section ───────────────────────────────────────────────────────────

export function computeCurvedSeats(s: CurvedSection): Seat[] {
	const seats: Seat[] = [];
	const halfSpanRad = (s.arcSpan / 2) * (Math.PI / 180);
	const centerRad   = s.centerAngle  * (Math.PI / 180);
	const startRad    = centerRad - halfSpanRad;
	const endRad      = centerRad + halfSpanRad;
	const rowStep     = s.seatSize + s.rowGap;
	// Angle between seats: divide arc into (seatsPerRow - 1) equal steps.
	// With 1 seat the step is 0 (seat placed at centerAngle).
	const angleStep   = s.seatsPerRow > 1 ? (endRad - startRad) / (s.seatsPerRow - 1) : 0;

	for (let r = 0; r < s.rows; r++) {
		const row    = rowLabel(r, s.rowLabel);
		const radius = s.innerRadius + r * rowStep;

		for (let c = 0; c < s.seatsPerRow; c++) {
			const angle       = startRad + c * angleStep;
			const x           = s.cx + radius * Math.cos(angle);
			const y           = s.cy + radius * Math.sin(angle);
			const seatRotation = (angle * 180) / Math.PI + 90;

			seats.push({
				id: `${s.key}-${row}-${s.seatStart + c}`,
				x, y,
				rotation: seatRotation,
				row,
				num: s.seatStart + c,
				sectionKey: s.key,
				category: s.category,
			});
		}
	}

	return seats;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function computeFlatSeats(s: FlatSection): Seat[] {
	return s.seats.map((fs) => ({
		id: `${s.key}-${fs.row}-${fs.num}`,
		x: s.x + fs.localX,
		y: s.y + fs.localY,
		rotation: 0,
		row: fs.row,
		num: fs.num,
		sectionKey: s.key,
		category: s.category,
	}));
}

export function computeSeats(section: Section): Seat[] {
	switch (section.type) {
		case 'rows':        return computeRowsSeats(section);
		case 'table':       return computeTableSeats(section);
		case 'rect':        return computeRectSeats(section);
		case 'arc':         return computeArcSeats(section);
		case 'curved':      return computeCurvedSeats(section);
		case 'flat':        return computeFlatSeats(section);
		case 'ga':          return []; // GA has no individual seats
		case 'stage':       return []; // orientation reference, no seats
		case 'venue-shape': return []; // guide only, no seats
	}
}

export function computeAllSeats(sections: Section[]): Seat[] {
	return sections.flatMap(computeSeats);
}

// Bounding box of a rect section (for editor hit-testing)
export function rectSectionBounds(s: RectSection) {
	const w = s.seatsPerRow * (s.seatSize + s.seatGap) - s.seatGap;
	const h = s.rows * (s.seatSize + s.rowGap) - s.rowGap;
	return { w, h };
}
