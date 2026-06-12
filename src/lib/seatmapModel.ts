// SuperStage — seat-map editor model + geometry (TixLive 2.0 design).
// A chart is a flat document of sections / zones / tables / stage / outlines plus
// pricing categories. A section is a parametric grid that bends into a fan and
// rotates to face the stage. Seats are computed at render time (nothing per-seat
// is stored except `killed` overrides).

const D2R = Math.PI / 180;
const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const MAX_ARC = 150; // degrees of sweep at curve = 100

export type LabelMode = 'alpha' | 'num' | 'none';

export interface SmCat {
	id: string;
	name: string;
	color: string;
	price?: number;
}
export interface SmSection {
	id: string;
	name: string;
	cat: string;
	cx: number;
	cy: number;
	rows: number;
	cols: number;
	gapX: number;
	gapY: number;
	seatSize: number;
	curve: number; // 0–100 (0 = straight)
	rot: number; // degrees
	dir: 1 | -1; // curve direction
	// Bend model. 'concentric' = constant gapX spacing at every radius (columns converge).
	// 'radial' = the Yandex funnel: every row shares the front row's angular step, so
	// columns are straight rays and the spacing WIDENS toward the back rows (equal-count
	// rows: row 2 spreads wider than row 1). Neither touches `align` (owned by the
	// "Aliniere rânduri" control).
	fan?: 'concentric' | 'radial';
	// Contour wrap (the REAL Yandex mechanic): when set, the section's rows follow the
	// venue outline as parallel OFFSET curves — straight above straight walls, bending
	// exactly with the corner arcs, mid-row if needed. Columns run along the contour's
	// normals. The anchor stays (cx,cy): its projection onto the outline gives the along-
	// contour position and the front-row depth, so dragging the section slides it along
	// the contour. rot/curve/stretch are ignored while wrapped; flipH/flipV mirror the
	// seat order / row order.
	wrap?: { oid: string };
	stretch?: number; // 0–100, 50 = neutral (horizontal stretch of the block)
	// Lateral offset added per visual row (px): each row starts `shear` further
	// along than the previous — slanted block edges (real-hall trapezoid cuts,
	// row continuation across a diagonal aisle). Applied in grid AND wrap layouts.
	shear?: number;
	flipH?: boolean;
	flipV?: boolean;
	align?: 'left' | 'center' | 'right' | 'none'; // cut-row alignment ('none' = keep grid positions)
	outline?: boolean; // draw a titled boundary box around the section
	labels: LabelMode;
	labelSide?: 'left' | 'right' | 'both'; // which side the row labels sit on
	labelSize?: number; // row-label font size in px (default 10)
	labelColor?: string; // row-label colour (default muted ink)
	killed: Record<string, 1 | undefined>; // "ri-ci" → removed
	// Numbering (Number Seats): start value + direction for seats and rows.
	seatStart?: number;
	seatRTL?: boolean; // seats numbered right→left
	rowStart?: number;
	rowRTL?: boolean; // rows labelled bottom→top
	showNums?: boolean; // print the seat number on every seat (not just on select)
	nudge?: Record<string, [number, number]>; // per-seat local offset ("ri-ci" → [dx,dy])
	// Explicit-position seats (produced by Extract Seats, or imported from a legacy v1
	// flat chart). When set, the section is a free list of points (offsets from cx,cy,
	// rotated by `rot`) and rows/cols/curve are ignored. `row`/`num` carry the original
	// row label and seat number so public seat ids ("<name>-<row>-<num>") survive
	// 1:1 across the v1→v2 migration.
	flat?: { lx: number; ly: number; row?: string; num?: number }[];
}
export interface SmZone {
	id: string;
	name: string;
	x: number;
	y: number;
	w: number;
	h: number;
	cap: number;
	color: string;
}
export interface SmTable {
	id: string;
	name: string;
	cx: number;
	cy: number;
	seats: number; // round-table seat count
	r: number; // round-table radius
	shape?: 'round' | 'rect';
	w?: number;
	h?: number;
	sides?: { top: number; bottom: number; left: number; right: number }; // rect chairs per side
}
export function tableSeatCount(t: SmTable): number {
	if (t.shape === 'rect') {
		const s = t.sides || { top: 0, bottom: 0, left: 0, right: 0 };
		return s.top + s.bottom + s.left + s.right;
	}
	return t.seats;
}
export interface SmStage {
	cx: number;
	cy: number;
	w: number;
	h: number;
	rot: number;
	label: string;
	// Signed sagitta (px) of the stage front line: 0 = straight, positive bulges
	// TOWARD the audience (the Yandex «Сцена» arc), negative bulges away.
	bow?: number;
}
export interface SmOutline {
	id: string;
	x: number;
	y: number;
	w: number;
	h: number;
	rx: number; // uniform corner radius (fallback when `corners` is unset)
	corners?: [number, number, number, number]; // per-corner radii [TL, TR, BR, BL]
}
// Resolve the 4 corner radii (TL, TR, BR, BL), each clamped to the box. Falls back to
// the uniform `rx` when no per-corner override is set.
export function outlineRadii(o: SmOutline): [number, number, number, number] {
	const cap = Math.min(o.w, o.h) / 2;
	const c = o.corners || [o.rx, o.rx, o.rx, o.rx];
	return [Math.max(0, Math.min(c[0], cap)), Math.max(0, Math.min(c[1], cap)), Math.max(0, Math.min(c[2], cap)), Math.max(0, Math.min(c[3], cap))];
}
// Décor: rectangle, free text label, stairs glyph or a direction arrow.
export interface SmShape {
	id: string;
	kind: 'rect' | 'label' | 'stairs' | 'arrow';
	x: number;
	y: number;
	w: number;
	h: number;
	angle: number; // degrees
	text?: string;
	fontSize?: number;
	fill?: string; // '' / undefined = outline only
	radius?: number; // rect corner radius (default 8)
	// Signed sagitta (px) of the rect's LONG edges: both top and bottom bow by
	// the same amount → an annular band like the Yandex tier slabs. Positive
	// bulges toward -y in the shape's local frame (up before rotation).
	bend?: number;
}
// A background image to trace over (the real venue plan). Stored as a data URL in
// the document; position/size in world coords, opacity 0–1, lock to draw on top.
export interface SmUnderlay {
	src: string;
	x: number;
	y: number;
	w: number;
	h: number;
	opacity: number;
	locked?: boolean;
}
export interface SmState {
	name: string;
	cats: SmCat[];
	sections: SmSection[];
	zones: SmZone[];
	tables: SmTable[];
	stage: SmStage | null;
	outlines: SmOutline[];
	shapes?: SmShape[];
	underlay?: SmUnderlay | null;
}

export interface SmSeat {
	x: number;
	y: number;
	ri: number;
	ci: number;
	key: string;
}

export const uid = (p = 's') => p + Math.random().toString(36).slice(2, 8);

export function rowLab(sec: Pick<SmSection, 'labels'>, ri: number): string {
	if (sec.labels === 'num') return String(ri + 1);
	return ri < 26 ? ALPHA[ri] : ALPHA[Math.floor(ri / 26) - 1] + ALPHA[ri % 26];
}

// Seats in row `ri`. ALWAYS `cols` — both fan models keep the seat COUNT the user laid out
// (or cut). Kept as a function for the per-row signature callers use.
export function rowCount(sec: SmSection, _ri: number): number {
	return sec.cols;
}

// Effective cut-row alignment. Defaults to 'center'; 'none' (keep grid positions — the
// Yandex behaviour) is an explicit user choice via the panel. The fan buttons never
// change this — alignment is fully owned by the "Aliniere rânduri" control.
export function effAlign(sec: SmSection): 'left' | 'center' | 'right' | 'none' {
	return sec.align || 'center';
}
// Alignment expressed in GRID columns. The stored value is VISUAL («Stânga» =
// the section's screen-left); dirX is the world-x direction of the +lateral
// axis (where seat numbers grow): rows reading leftward on screen swap sides.
// Near-vertical rows (|dirX| small) fall back to the mirror-based mapping so
// the side doesn't flicker with tiny tangent changes.
export function alignForDir(sec: SmSection, dirX: number): 'left' | 'center' | 'right' | 'none' {
	const v = effAlign(sec);
	if (v === 'center' || v === 'none') return v;
	if (Math.abs(dirX) < 0.05) return gridAlign(sec);
	return dirX > 0 ? v : v === 'left' ? 'right' : 'left';
}
function gridAlign(sec: SmSection): 'left' | 'center' | 'right' | 'none' {
	const eff = effAlign(sec);
	if (!sec.flipH) return eff;
	return eff === 'left' ? 'right' : eff === 'right' ? 'left' : eff;
}
// World-x direction of the +lateral axis for a section laid out by seatsOf:
// wrapped → the path tangent at its anchor (×flipH); free → its rotation axis.
export function lateralDirX(sec: SmSection, wrapOutline?: SmWrapRef): number {
	const fh = sec.flipH ? -1 : 1;
	if (sec.wrap && wrapOutline) {
		const segs = wrapSegsOf(wrapOutline);
		const pr = wrapProject(wrapOutline, sec.cx, sec.cy);
		const sg = segs[pr.si];
		const tx = sg.kind === 'line' ? sg.dx : -Math.sin(sg.a0 + (sg.sw ?? 1) * pr.u) * (sg.sw ?? 1);
		return tx * fh;
	}
	return Math.cos(sec.rot * Math.PI / 180) * fh;
}


// ── Contour-wrap geometry ───────────────────────────────────────────────────────────
// The outline boundary as an ordered clockwise segment list (4 straights + 4 corner
// arcs). Positions on the path are addressed by (segment index, u) where u is the
// distance along a straight or the ANGLE inside an arc. Offsetting outward by d keeps
// straights identical and grows corner radii to r+d — exactly how venue rows behave.
interface OSeg {
	kind: 'line' | 'arc';
	// line
	x0: number;
	y0: number;
	dx: number; // unit direction
	dy: number;
	nx: number; // outward normal
	ny: number;
	len: number; // line length, or arc angular span (radians)
	// arc
	cx: number;
	cy: number;
	r: number;
	a0: number; // start angle
	sw?: 1 | -1; // arc sweep: angle = a0 + sw·u (default 1)
	off?: 1 | -1; // arc offset side: radius at depth d = r + off·d (default 1 = outward)
	vis?: number; // visible span (full-circle stage arcs: only [0, vis] is drawn)
}
export function outlineSegs(o: SmOutline): OSeg[] {
	const [rtl, rtr, rbr, rbl] = outlineRadii(o);
	const L = (x0: number, y0: number, x1: number, y1: number, nx: number, ny: number): OSeg => {
		const len = Math.hypot(x1 - x0, y1 - y0);
		return { kind: 'line', x0, y0, dx: len ? (x1 - x0) / len : 1, dy: len ? (y1 - y0) / len : 0, nx, ny, len, cx: 0, cy: 0, r: 0, a0: 0 };
	};
	const A = (cx: number, cy: number, r: number, a0: number): OSeg => ({ kind: 'arc', x0: 0, y0: 0, dx: 0, dy: 0, nx: 0, ny: 0, len: Math.PI / 2, cx, cy, r, a0 });
	const { x, y, w, h } = o;
	return [
		L(x + rtl, y, x + w - rtr, y, 0, -1),
		A(x + w - rtr, y + rtr, rtr, -Math.PI / 2),
		L(x + w, y + rtr, x + w, y + h - rbr, 1, 0),
		A(x + w - rbr, y + h - rbr, rbr, 0),
		L(x + w - rbr, y + h, x + rbl, y + h, 0, 1),
		A(x + rbl, y + h - rbl, rbl, Math.PI / 2),
		L(x, y + h - rbl, x, y + rtl, -1, 0),
		A(x + rtl, y + rtl, rtl, Math.PI),
	];
}
// Point + outward normal at (segment si, param u) offset outward by depth d.
function osegPoint(segs: OSeg[], si: number, u: number, d: number): { x: number; y: number; nx: number; ny: number } {
	const s = segs[si];
	if (s.kind === 'line') return { x: s.x0 + s.dx * u + s.nx * d, y: s.y0 + s.dy * u + s.ny * d, nx: s.nx, ny: s.ny };
	const a = s.a0 + (s.sw ?? 1) * u;
	const off = s.off ?? 1;
	const rx = Math.cos(a);
	const ry = Math.sin(a);
	return { x: s.cx + rx * (s.r + off * d), y: s.cy + ry * (s.r + off * d), nx: rx * off, ny: ry * off };
}
// Walk `dist` px along the offset curve at depth d, starting from (si,u). Straights
// consume 1:1; an arc of base radius r has offset length (r+d)·span, so du = dist/(r+d).
function osegWalk(segs: OSeg[], si: number, u: number, d: number, dist: number): { si: number; u: number } {
	let i = si;
	let cu = u;
	let left = dist;
	const fwd = left >= 0;
	left = Math.abs(left);
	for (let guard = 0; guard < 64 && left > 1e-9; guard++) {
		const s = segs[i];
		// offset px per unit of u; a concave arc (off=-1) collapses at d→r, clamp keeps
		// the walk finite (rows past the focal point pile up instead of exploding).
		const scale = s.kind === 'line' ? 1 : Math.max(1e-6, s.r + (s.off ?? 1) * d);
		const room = fwd ? (s.len - cu) * scale : cu * scale;
		if (left <= room) {
			cu += ((fwd ? 1 : -1) * left) / scale;
			return { si: i, u: cu };
		}
		left -= room;
		if (fwd) {
			i = (i + 1) % segs.length;
			cu = 0;
		} else {
			i = (i - 1 + segs.length) % segs.length;
			cu = segs[i].len;
		}
	}
	return { si: i, u: cu };
}
// Nearest point of the boundary to (px,py): returns the segment address and the SIGNED
// distance (positive outside the outline — where the seats live).
export function outlineProject(o: SmOutline, px: number, py: number): { si: number; u: number; d: number } {
	const segs = outlineSegs(o);
	let best = { si: 0, u: 0, d: Infinity };
	let bestAbs = Infinity;
	for (let i = 0; i < segs.length; i++) {
		const s = segs[i];
		if (s.len <= 1e-9 && s.kind === 'line') continue;
		let u: number;
		let d: number;
		if (s.kind === 'line') {
			u = Math.max(0, Math.min(s.len, (px - s.x0) * s.dx + (py - s.y0) * s.dy));
			d = (px - s.x0) * s.nx + (py - s.y0) * s.ny;
		} else {
			const ang = Math.atan2(py - s.cy, px - s.cx);
			let rel = ang - s.a0;
			while (rel < -Math.PI) rel += 2 * Math.PI;
			while (rel > Math.PI) rel -= 2 * Math.PI;
			u = Math.max(0, Math.min(s.len, rel));
			d = Math.hypot(px - s.cx, py - s.cy) - s.r;
		}
		const p = osegPoint(segs, i, u, 0);
		const abs = Math.hypot(px - p.x, py - p.y);
		if (abs < bestAbs) {
			bestAbs = abs;
			best = { si: i, u, d };
		}
	}
	return best;
}

// ── Stage as a wrap reference ────────────────────────────────────────────────
// The stage front is ONE open curve (vs the outline's closed 4-side loop): a
// straight chord of length w, or — when `bow` is set — a circular arc with that
// sagitta, bulging toward the audience (bow>0) or away (bow<0). The path is
// padded with long tangent lines on both ends so sections wider than the stage
// extrapolate straight instead of wrapping around.
const STAGE_EXT = 1e5;
export function stageSegs(st: SmStage): OSeg[] {
	const rr = (st.rot || 0) * D2R;
	const cosR = Math.cos(rr);
	const sinR = Math.sin(rr);
	const W = (lx: number, ly: number) => ({ x: st.cx + lx * cosR - ly * sinR, y: st.cy + lx * sinR + ly * cosR });
	const L = (p0: { x: number; y: number }, p1: { x: number; y: number }, nx: number, ny: number): OSeg => {
		const len = Math.hypot(p1.x - p0.x, p1.y - p0.y);
		return { kind: 'line', x0: p0.x, y0: p0.y, dx: len ? (p1.x - p0.x) / len : 1, dy: len ? (p1.y - p0.y) / len : 0, nx, ny, len, cx: 0, cy: 0, r: 0, a0: 0 };
	};
	// The front line sits on the audience-facing edge of the stage body (local
	// y = +h/2, where the old stage rectangle ended) so charts built against the
	// rect keep their stage→first-row distance.
	const fy = st.h / 2;
	const A = W(-st.w / 2, fy);
	const B = W(st.w / 2, fy);
	const s = st.bow || 0;
	if (Math.abs(s) < 0.5) {
		// straight front: one infinite line split in three so (si=1, u∈[0,w]) is the stage
		const dx = (B.x - A.x) / st.w;
		const dy = (B.y - A.y) / st.w;
		const nx = -sinR; // audience side: local +y
		const ny = cosR;
		const pre = { x: A.x - dx * STAGE_EXT, y: A.y - dy * STAGE_EXT };
		const post = { x: B.x + dx * STAGE_EXT, y: B.y + dy * STAGE_EXT };
		return [L(pre, A, nx, ny), L(A, B, nx, ny), L(B, post, nx, ny)];
	}
	const R = (st.w * st.w) / (8 * Math.abs(s)) + Math.abs(s) / 2;
	// centre in the stage's local frame: behind the line for bow>0, in front for bow<0
	const C = W(0, fy + (s > 0 ? s - R : s + R));
	const off: 1 | -1 = s > 0 ? 1 : -1;
	const aA = Math.atan2(A.y - C.y, A.x - C.x);
	const aB = Math.atan2(B.y - C.y, B.x - C.x);
	// sweep so the path runs A→B as u grows
	let span = aB - aA;
	while (span > Math.PI) span -= 2 * Math.PI;
	while (span < -Math.PI) span += 2 * Math.PI;
	const sw: 1 | -1 = span >= 0 ? 1 : -1;
	// One FULL-CIRCLE arc: beyond the stage edges the rows keep fanning around the
	// same curvature centre (amphitheatre), instead of breaking into a straight
	// tangent slab. (si=0, u∈[0,|span|]) is the visible stage front; the walk wraps
	// around the circle seamlessly. The straight-stage case above keeps tangent
	// extension lines — a straight front extends straight.
	return [{ kind: 'arc', x0: 0, y0: 0, dx: 0, dy: 0, nx: 0, ny: 0, len: 2 * Math.PI, cx: C.x, cy: C.y, r: R, a0: aA, sw, off, vis: Math.abs(span) }];
}
// Nearest point of the stage path to (px,py): segment address + SIGNED distance
// (positive on the audience side, where the seats live).
export function stageProject(st: SmStage, px: number, py: number): { si: number; u: number; d: number } {
	const segs = stageSegs(st);
	let best = { si: 0, u: 0, d: Infinity };
	let bestAbs = Infinity;
	for (let i = 0; i < segs.length; i++) {
		const s = segs[i];
		let u: number;
		let d: number;
		if (s.kind === 'line') {
			u = Math.max(0, Math.min(s.len, (px - s.x0) * s.dx + (py - s.y0) * s.dy));
			d = (px - s.x0) * s.nx + (py - s.y0) * s.ny;
		} else {
			const ang = Math.atan2(py - s.cy, px - s.cx);
			let rel = (ang - s.a0) * (s.sw ?? 1);
			// full circle: any angle is on the path — wrap into [0, 2π) instead of clamping
			while (rel < 0) rel += 2 * Math.PI;
			while (rel >= 2 * Math.PI) rel -= 2 * Math.PI;
			u = Math.min(s.len, rel);
			d = (s.off ?? 1) * (Math.hypot(px - s.cx, py - s.cy) - s.r);
		}
		const p = osegPoint(segs, i, u, 0);
		const abs = Math.hypot(px - p.x, py - p.y);
		if (abs < bestAbs) {
			bestAbs = abs;
			best = { si: i, u, d };
		}
	}
	return best;
}
// Foot of the projection of (px,py) on the stage path + the audience-side normal
// there. Lets callers move a point to an exact depth: pos = foot + n·d.
export function stageFootAt(st: SmStage, px: number, py: number): { x: number; y: number; nx: number; ny: number; d: number } {
	const segs = stageSegs(st);
	const pr = stageProject(st, px, py);
	const p = osegPoint(segs, pr.si, pr.u, 0);
	return { x: p.x, y: p.y, nx: p.nx, ny: p.ny, d: pr.d };
}
// Slide (px,py) by `dist` px along the stage path, keeping its depth.
export function stageSlideAt(st: SmStage, px: number, py: number, dist: number): { x: number; y: number } {
	const segs = stageSegs(st);
	const pr = stageProject(st, px, py);
	const at = osegWalk(segs, pr.si, pr.u, pr.d, dist);
	const p = osegPoint(segs, at.si, at.u, pr.d);
	return { x: p.x, y: p.y };
}
// Sample the stage front line (the visible part only) for rendering.
export function stageLine(st: SmStage, samples = 40): { x: number; y: number }[] {
	const segs = stageSegs(st);
	const si = segs.length === 1 ? 0 : 1; // bowed: single full-circle arc; straight: mid line
	const span = segs[si].vis ?? segs[si].len;
	const pts: { x: number; y: number }[] = [];
	for (let i = 0; i <= samples; i++) {
		const p = osegPoint(segs, si, (span * i) / samples, 0);
		pts.push({ x: p.x, y: p.y });
	}
	return pts;
}
// A wrapped section can follow either the venue outline or the stage front.
export type SmWrapRef = SmOutline | SmStage;
function isStageRef(w: SmWrapRef): w is SmStage {
	return (w as SmStage).cx !== undefined;
}
function wrapSegsOf(w: SmWrapRef): OSeg[] {
	return isStageRef(w) ? stageSegs(w) : outlineSegs(w);
}
function wrapProject(w: SmWrapRef, px: number, py: number): { si: number; u: number; d: number } {
	return isStageRef(w) ? stageProject(w, px, py) : outlineProject(w, px, py);
}

// ── Generic wrap-reference helpers (stage OR outline) ────────────────────────
// Foot of the projection of (px,py) + the seats-side normal, on any wrap ref.
export function wrapFootAt(ref: SmWrapRef, px: number, py: number): { x: number; y: number; nx: number; ny: number; d: number } {
	const segs = wrapSegsOf(ref);
	const pr = wrapProject(ref, px, py);
	const p = osegPoint(segs, pr.si, pr.u, 0);
	return { x: p.x, y: p.y, nx: p.nx, ny: p.ny, d: pr.d };
}
// Path tangent + seats-side normal at the projection of (px,py).
export function wrapTangentAt(ref: SmWrapRef, px: number, py: number): { tx: number; ty: number; nx: number; ny: number } {
	const segs = wrapSegsOf(ref);
	const pr = wrapProject(ref, px, py);
	const s = segs[pr.si];
	if (s.kind === 'line') return { tx: s.dx, ty: s.dy, nx: s.nx, ny: s.ny };
	const a = s.a0 + (s.sw ?? 1) * pr.u;
	const off = s.off ?? 1;
	return { tx: -Math.sin(a) * (s.sw ?? 1), ty: Math.cos(a) * (s.sw ?? 1), nx: Math.cos(a) * off, ny: Math.sin(a) * off };
}
// Slide (px,py) by `dist` px along the reference path, keeping its depth.
export function wrapSlideAt(ref: SmWrapRef, px: number, py: number, dist: number): { x: number; y: number } {
	const segs = wrapSegsOf(ref);
	const pr = wrapProject(ref, px, py);
	const at = osegWalk(segs, pr.si, pr.u, pr.d, dist);
	const p = osegPoint(segs, at.si, at.u, pr.d);
	return { x: p.x, y: p.y };
}
// Signed walk distance (px, measured at depth d) from the projection of A to the
// projection of B along the reference path. Closed paths (outline loop, bowed
// stage circle) take the short way around — no 0/2π seam artefacts.
export function wrapPathDistAt(ref: SmWrapRef, ax: number, ay: number, bx: number, by: number, d: number): number {
	const segs = wrapSegsOf(ref);
	const scaleOf = (s: OSeg) => (s.kind === 'line' ? 1 : Math.max(1e-6, s.r + (s.off ?? 1) * d));
	const coord = (pr: { si: number; u: number }) => {
		let acc = 0;
		for (let i = 0; i < pr.si; i++) acc += segs[i].len * scaleOf(segs[i]);
		return acc + pr.u * scaleOf(segs[pr.si]);
	};
	const a = wrapProject(ref, ax, ay);
	const b = wrapProject(ref, bx, by);
	let diff = coord(b) - coord(a);
	const closed = !isStageRef(ref) || Math.abs((ref as SmStage).bow || 0) >= 0.5;
	if (closed) {
		const total = segs.reduce((acc, s) => acc + s.len * scaleOf(s), 0);
		while (diff > total / 2) diff -= total;
		while (diff < -total / 2) diff += total;
	}
	return diff;
}

// Least-squares straight lines through the cut's row ends (in raw grid lateral units):
// loFit/hiFit give, per row, where the first/last surviving seat SHOULD sit so that both
// edges are perfectly straight. Rows are then linearly remapped onto [loFit, hiFit].
// Robust: rows whose ends sit far off the trend (> 1.5 seats — e.g. a hand-placed stub
// row) are excluded from the fit AND stay exactly where the user put them.
export function wrapJustify(sec: SmSection, effOverride?: 'left' | 'center' | 'right' | 'none'): { lo: (ri: number) => number; hi: (ri: number) => number; skip: Set<number> } | null {
	// Fit over the ALIGNED end positions (alignment shift applied) — fitting the raw grid
	// columns re-introduced the cut's lean (e.g. hi=20 const) that alignment removes, and
	// wrapped around a corner that lean became a spiral.
	const eff = effOverride ?? gridAlign(sec);
	const pts: { ri: number; lo: number; hi: number }[] = [];
	for (let ri = 0; ri < sec.rows; ri++) {
		let lo = -1;
		let hi = -1;
		for (let ci = 0; ci < sec.cols; ci++) {
			if (sec.killed && sec.killed[ri + '-' + ci]) continue;
			if (lo < 0) lo = ci;
			hi = ci;
		}
		if (lo < 0 || hi <= lo) continue;
		let sh = 0;
		if (eff !== 'none' && !(lo === 0 && hi === sec.cols - 1)) {
			sh = eff === 'left' ? -lo : eff === 'right' ? sec.cols - 1 - hi : (sec.cols - 1) / 2 - (lo + hi) / 2;
		}
		pts.push({ ri, lo: lo + sh, hi: hi + sh });
	}
	if (pts.length < 2) return null;
	// Theil–Sen: median of pairwise slopes + median intercept — a stray hand-made stub
	// row cannot bend the line (plain least-squares got wrecked by exactly that).
	const median = (a: number[]) => {
		const s = [...a].sort((x, y) => x - y);
		const m = s.length >> 1;
		return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
	};
	const fit = (get: (p: { ri: number; lo: number; hi: number }) => number) => {
		const slopes: number[] = [];
		for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if (pts[j].ri !== pts[i].ri) slopes.push((get(pts[j]) - get(pts[i])) / (pts[j].ri - pts[i].ri));
		const b = slopes.length ? median(slopes) : 0;
		const a = median(pts.map((p) => get(p) - b * p.ri));
		return (ri: number) => a + b * ri;
	};
	const lo = fit((p) => p.lo);
	const hi = fit((p) => p.hi);
	// Every inlier row lands EXACTLY on its trend value — the edge reads as one smooth
	// incline (the Yandex look). Outlier = a hand-made stub far off the trend (the K row
	// sits ~15 seats off); legitimate staircases deviate up to ~2 seats and MUST pass,
	// otherwise one twin of an equal pair justifies while the other sticks out raw (the
	// old row-B bug).
	const skip = new Set(pts.filter((p) => Math.abs(p.lo - lo(p.ri)) > 4 || Math.abs(p.hi - hi(p.ri)) > 4).map((p) => p.ri));
	return { lo, hi, skip };
}

// One wrapped seat: ei = effective column (alignment applied), depth grows outward by
// row. Spacing is CONSTANT gapX in every row — walked along the row's own offset curve.
// Real venues (full VTB schema, incl. the corner sector A104) keep ~constant spacing
// everywhere; ray-columns that widen with depth over-spread on small corner radii.
function wrapPoint(
	segs: OSeg[],
	anchor: { si: number; u: number; d: number },
	sec: SmSection,
	ri: number,
	ei: number,
	ndx: number,
	ndy: number
): { x: number; y: number } {
	const d0 = Math.max(2, anchor.d);
	// Oglindă ↔ mirrors the seat order along the contour; Oglindă ↕ mirrors the row
	// order across the band (row A swaps with the outermost row).
	const fh = sec.flipH ? -1 : 1;
	const riEff = sec.flipV ? sec.rows - 1 - ri : ri;
	const lateral = fh * ((ei - (sec.cols - 1) / 2) * sec.gapX + ndx);
	const depth = d0 + riEff * sec.gapY + ndy;
	const at = osegWalk(segs, anchor.si, anchor.u, depth, lateral);
	return osegPoint(segs, at.si, at.u, depth);
}

// Parametric grid → seat positions. Straight when curve≈0; otherwise each row is an arc.
// The fan models differ in the angular step: concentric = gapX/Rr (constant spacing),
// radial = gapX/R shared by all rows (ray columns, spacing widens toward the back — the
// Yandex funnel). When `sec.wrap` is set and the outline is provided, the grid follows
// the CONTOUR instead: rows = parallel offsets of the outline (bending exactly where it
// bends), columns = contour normals ('radial', the Yandex look) or constant-spacing
// walks per row ('concentric').
export function seatsOf(sec: SmSection, wrapOutline?: SmWrapRef): SmSeat[] {
	const { rows, cols, gapX, gapY, curve, rot, dir } = sec;
	const rr = rot * D2R;
	const cosR = Math.cos(rr);
	const sinR = Math.sin(rr);

	// Explicit-position (extracted) section.
	if (sec.flat && sec.flat.length) {
		return sec.flat.map((p, i) => ({
			x: sec.cx + p.lx * cosR - p.ly * sinR,
			y: sec.cy + p.lx * sinR + p.ly * cosR,
			ri: 0,
			ci: i,
			key: 'f-' + i,
		}));
	}

	const arc = (curve / 100) * MAX_ARC * D2R;
	const straight = arc < 0.02 || cols < 2;
	const R = straight ? 0 : ((cols - 1) * gapX) / arc;
	const sf = sec.stretch != null ? 0.4 + (sec.stretch / 100) * 1.2 : 1; // 50 → 1.0
	const fh = sec.flipH ? -1 : 1;
	const fv = sec.flipV ? -1 : 1;
	const eff = alignForDir(sec, lateralDirX(sec, sec.wrap ? wrapOutline : undefined));
	// Contour/stage wrap: rows follow the reference's offset curves instead of the
	// parametric arc.
	const wseg = sec.wrap && wrapOutline ? wrapSegsOf(wrapOutline) : null;
	const wanchor = wseg ? wrapProject(wrapOutline!, sec.cx, sec.cy) : null;
	// Wrapped 'radial' = JUSTIFIED edges (the Yandex finish): fit straight lines through
	// the cut's first/last survivors across rows, then stretch each row linearly so its
	// end seats land EXACTLY on those lines. Spacing varies a touch per row (the real
	// A103 measures 18–20px row to row); inner aisles keep their proportions.
	const wjust = wseg && sec.fan === 'radial' ? wrapJustify(sec, eff) : null;

	const out: SmSeat[] = [];
	for (let ri = 0; ri < rows; ri++) {
		const n = rowCount(sec, ri);
		// per-row alignment shift (in seat units), based on this row's surviving seats.
		let lo = -1;
		let hi = -1;
		for (let ci = 0; ci < n; ci++) {
			if (sec.killed && sec.killed[ri + '-' + ci]) continue;
			if (lo < 0) lo = ci;
			hi = ci;
		}
		let sh = 0;
		if (eff !== 'none' && lo >= 0 && !(lo === 0 && hi === n - 1)) {
			sh = eff === 'left' ? -lo : eff === 'right' ? n - 1 - hi : (n - 1) / 2 - (lo + hi) / 2;
		}
		// per-row lateral shear, in column-index units so it works for straight,
		// curved and wrapped layouts alike
		const shAdd = (sec.flipV ? rows - 1 - ri : ri) * (gapX > 0 ? (sec.shear || 0) / gapX : 0);
		for (let ci = 0; ci < n; ci++) {
			const ei = ci + sh + shAdd; // effective column index after alignment + shear
			// nudge in the row's own frame: nd[0] ALONG the row (arc length), nd[1] ACROSS.
			const nd = sec.nudge && sec.nudge[ri + '-' + ci];
			const ndx = nd ? nd[0] : 0;
			const ndy = nd ? nd[1] : 0;
			if (wseg && wanchor) {
				// justified row: remap [first..last survivor] onto the fitted edge lines.
				const we = wjust && !wjust.skip.has(ri) && lo >= 0 && hi > lo ? wjust.lo(ri) + ((ci - lo) * (wjust.hi(ri) - wjust.lo(ri))) / (hi - lo) + shAdd : ei;
				const p = wrapPoint(wseg, wanchor, sec, ri, we, ndx, ndy);
				out.push({ x: p.x, y: p.y, ri, ci, key: ri + '-' + ci });
				continue;
			}
			let lx: number;
			let ly: number;
			if (straight) {
				lx = (ei - (n - 1) / 2) * gapX * sf * fh + ndx;
				ly = ri * gapY * fv + ndy;
			} else {
				// concentric: angular step gapX/Rr → constant seat-to-seat spacing at every
				// radius (columns converge). radial (the Yandex funnel): a SHARED step gapX/R
				// (front-row), so seat ci sits at the same angle in every row → straight ray
				// columns, and the spacing widens toward the back rows (row 2 wider than row 1
				// at equal counts — the user's A103 reference). Gentle curve keeps it subtle.
				const Rr = R + ri * gapY + ndy;
				const step = sec.fan === 'radial' ? gapX / R : gapX / Rr;
				const a = n === 1 ? 0 : (ei - (n - 1) / 2) * step + ndx / Rr;
				lx = Rr * Math.sin(a) * sf * fh;
				const bend = Rr * Math.cos(a) - R - ri * gapY;
				ly = (ri * gapY + dir * bend) * fv;
			}
			out.push({ x: sec.cx + lx * cosR - ly * sinR, y: sec.cy + lx * sinR + ly * cosR, ri, ci, key: ri + '-' + ci });
		}
	}
	return out;
}

// Position of a single (ri, ci) using the exact seat geometry, for ANY column index
// — including ci just outside the row (e.g. -1 or cols). Used to place row labels as a
// phantom "+1 seat" at the start/end of a row, so a label follows the same arc, bend,
// rotation and spacing as a real seat. An optional `nudge` ([alongRow, acrossRow]) is
// applied in the same row frame as seatsOf — labels pass the neighbouring end seat's
// nudge so they track a hand-spaced row.
export function seatPos(sec: SmSection, ri: number, ci: number, nudge?: [number, number], wrapOutline?: SmWrapRef): { x: number; y: number } {
	const { cols, gapX, gapY, curve, rot, dir } = sec;
	const rr = rot * D2R;
	const cosR = Math.cos(rr);
	const sinR = Math.sin(rr);
	const arc = (curve / 100) * MAX_ARC * D2R;
	const straight = arc < 0.02 || cols < 2;
	const R = straight ? 0 : ((cols - 1) * gapX) / arc;
	const sf = sec.stretch != null ? 0.4 + (sec.stretch / 100) * 1.2 : 1;
	const fh = sec.flipH ? -1 : 1;
	const fv = sec.flipV ? -1 : 1;
	// per-row alignment shift (same as seatsOf)
	const n = rowCount(sec, ri);
	let loc = -1;
	let hic = -1;
	for (let c = 0; c < n; c++) {
		if (sec.killed && sec.killed[ri + '-' + c]) continue;
		if (loc < 0) loc = c;
		hic = c;
	}
	const eff = alignForDir(sec, lateralDirX(sec, sec.wrap ? wrapOutline : undefined));
	let sh = 0;
	if (eff !== 'none' && loc >= 0 && !(loc === 0 && hic === n - 1)) {
		sh = eff === 'left' ? -loc : eff === 'right' ? n - 1 - hic : (n - 1) / 2 - (loc + hic) / 2;
	}
	const shAdd = (sec.flipV ? sec.rows - 1 - ri : ri) * (gapX > 0 ? (sec.shear || 0) / gapX : 0);
	const ei = ci + sh + shAdd;
	const ndx = nudge ? nudge[0] : 0;
	const ndy = nudge ? nudge[1] : 0;
	if (sec.wrap && wrapOutline) {
		const segs = wrapSegsOf(wrapOutline);
		const anchor = wrapProject(wrapOutline, sec.cx, sec.cy);
		const wjust = sec.fan === 'radial' ? wrapJustify(sec, eff) : null;
		let we = ei;
		if (wjust && !wjust.skip.has(ri) && loc >= 0 && hic > loc) {
			const flo = wjust.lo(ri);
			const fhi = wjust.hi(ri);
			// Inside the row: justified interpolation. OUTSIDE (the label phantom at lo-1 /
			// hi+1): exactly ONE un-stretched seat pitch beyond the fitted edge line, so all
			// row labels sit on a clean line instead of inheriting each row's stretch.
			we = (ci < loc ? flo + (ci - loc) : ci > hic ? fhi + (ci - hic) : flo + ((ci - loc) * (fhi - flo)) / (hic - loc)) + shAdd;
		}
		return wrapPoint(segs, anchor, sec, ri, we, ndx, ndy);
	}
	let lx: number;
	let ly: number;
	if (straight) {
		lx = (ei - (n - 1) / 2) * gapX * sf * fh + ndx;
		ly = ri * gapY * fv + ndy;
	} else {
		const Rr = R + ri * gapY + ndy;
		const step = sec.fan === 'radial' ? gapX / R : gapX / Rr;
		const a = n === 1 ? 0 : (ei - (n - 1) / 2) * step + ndx / Rr;
		lx = Rr * Math.sin(a) * sf * fh;
		const bend = Rr * Math.cos(a) - R - ri * gapY;
		ly = (ri * gapY + dir * bend) * fv;
	}
	return { x: sec.cx + lx * cosR - ly * sinR, y: sec.cy + lx * sinR + ly * cosR };
}

export function centroidOf(pts: SmSeat[]): { x: number; y: number } {
	let sx = 0;
	let sy = 0;
	for (const p of pts) {
		sx += p.x;
		sy += p.y;
	}
	return { x: sx / (pts.length || 1), y: sy / (pts.length || 1) };
}

export function sectionSeatCount(s: SmSection): number {
	if (s.flat) return s.flat.length;
	let total = 0;
	for (let ri = 0; ri < s.rows; ri++) total += rowCount(s, ri);
	let killed = 0;
	if (s.killed) for (const k of Object.keys(s.killed)) {
		if (!s.killed[k]) continue;
		const [ri, ci] = k.split('-').map(Number);
		if (ri >= 0 && ri < s.rows && ci >= 0 && ci < rowCount(s, ri)) killed++;
	}
	return total - killed;
}

// Row label honouring numbering (start offset + direction).
export function rowLabelFor(sec: SmSection, ri: number): string {
	const eff = (sec.rowRTL ? sec.rows - 1 - ri : ri) + ((sec.rowStart || 1) - 1);
	if (sec.labels === 'num') return String(eff + 1);
	return eff < 26 ? ALPHA[eff] : ALPHA[Math.floor(eff / 26) - 1] + ALPHA[eff % 26];
}
// Seat number honouring numbering (start + direction). Uses the row's own seat count
// so RTL numbering is correct on variable-length (radial) rows.
export function seatNumberFor(sec: SmSection, ri: number, ci: number): number {
	return (sec.seatStart || 1) + (sec.seatRTL ? rowCount(sec, ri) - 1 - ci : ci);
}

export function totalSeats(state: SmState): { seats: number; sections: number } {
	let seats = 0;
	for (const s of state.sections) seats += sectionSeatCount(s);
	for (const t of state.tables) seats += tableSeatCount(t);
	return { seats, sections: state.sections.length + state.zones.length + state.tables.length };
}

// Default empty document for a brand-new chart.
export function emptyState(name = 'Schemă nouă'): SmState {
	return {
		name,
		cats: [
			{ id: 'c1', name: 'Categoria 1', color: '#7C3AED' },
			{ id: 'c2', name: 'Categoria 2', color: '#EC4899' },
			{ id: 'c3', name: 'Categoria 3', color: '#2563EB' },
			{ id: 'c4', name: 'Categoria 4', color: '#15915B' },
			{ id: 'c5', name: 'GA / Acces', color: '#D97706' },
		],
		sections: [],
		zones: [],
		tables: [],
		stage: { cx: 1000, cy: 1040, w: 380, h: 80, rot: 0, label: 'SCENĂ' },
		outlines: [],
		shapes: [],
		underlay: null,
	};
}

// Trim dead margins: shift every element so the content's top-left sits at a fixed
// padding. Keeps the layout identical, just removes drift/offset (used on save).
export function normalizeState(s: SmState): SmState {
	const PAD = 80;
	let x0 = 1e9;
	let y0 = 1e9;
	const ext = (x: number, y: number) => {
		if (x < x0) x0 = x;
		if (y < y0) y0 = y;
	};
	for (const sec of s.sections) for (const p of seatsOf(sec)) ext(p.x, p.y);
	for (const z of s.zones) ext(z.x, z.y);
	for (const t of s.tables) ext(t.cx - (t.shape === 'rect' ? (t.w || 80) / 2 : t.r), t.cy - (t.shape === 'rect' ? (t.h || 50) / 2 : t.r));
	if (s.stage) ext(s.stage.cx - s.stage.w / 2, s.stage.cy - s.stage.h / 2);
	for (const o of s.outlines) ext(o.x, o.y);
	for (const sh of s.shapes || []) ext(sh.x, sh.y);
	if (s.underlay) ext(s.underlay.x, s.underlay.y);
	if (x0 > 1e8) return s;
	const dx = PAD - x0;
	const dy = PAD - y0;
	if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return s;
	return {
		...s,
		sections: s.sections.map((sec) => ({ ...sec, cx: sec.cx + dx, cy: sec.cy + dy })),
		zones: s.zones.map((z) => ({ ...z, x: z.x + dx, y: z.y + dy })),
		tables: s.tables.map((t) => ({ ...t, cx: t.cx + dx, cy: t.cy + dy })),
		stage: s.stage ? { ...s.stage, cx: s.stage.cx + dx, cy: s.stage.cy + dy } : null,
		outlines: s.outlines.map((o) => ({ ...o, x: o.x + dx, y: o.y + dy })),
		shapes: (s.shapes || []).map((sh) => ({ ...sh, x: sh.x + dx, y: sh.y + dy })),
		underlay: s.underlay ? { ...s.underlay, x: s.underlay.x + dx, y: s.underlay.y + dy } : s.underlay,
	};
}

export function isSmState(v: unknown): v is SmState {
	return !!v && typeof v === 'object' && Array.isArray((v as SmState).sections) && Array.isArray((v as SmState).cats);
}
