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

export type SectionType = 'rect' | 'arc' | 'curved' | 'venue-shape' | 'ga' | 'flat';
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

export type Section = RectSection | ArcSection | CurvedSection | VenueShapeSection | GaSection | FlatSection;

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
		case 'rect':        return computeRectSeats(section);
		case 'arc':         return computeArcSeats(section);
		case 'curved':      return computeCurvedSeats(section);
		case 'flat':        return computeFlatSeats(section);
		case 'ga':          return []; // GA has no individual seats
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
