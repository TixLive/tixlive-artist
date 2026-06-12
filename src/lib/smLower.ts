// v2 (SmState) chart support — geometry parity contract with the admin editor.
//
// The payload for a v2 chart carries the raw editor document (geometry_version 2).
// We lower it CLIENT-side into the legacy Section[] shape (flat sections with
// explicit seat coordinates + ga zones) so the whole existing viewer/selection
// pipeline keeps working unchanged, and render the v2 décor (stage, venue
// contour, decor shapes) as an extra layer in the viewer.
//
// Seat-ID contract (must match the server): "<sectionName>-<row>-<num>", where
// row/num come from the section's labels/numbering, or — for sections imported
// from a v1 flat chart — the original row/num carried per seat.

import type { FlatSeat, GaSection, Section } from '@/lib/seatingGeometry';
import { isSmState, rowLabelFor, seatNumberFor, seatsOf, SmSection, SmState, SmWrapRef } from '@/lib/seatmapModel';

export { isSmState };
export type { SmState };

function wrapOutlineFor(st: SmState, sec: SmSection): SmWrapRef | undefined {
	if (!sec.wrap) return undefined;
	if (sec.wrap.oid === '@stage') return st.stage || undefined;
	return st.outlines.find((o) => o.id === sec.wrap!.oid) || st.outlines[0];
}

export function lowerSmStateToLegacy(st: SmState): Section[] {
	const out: Section[] = [];
	const usedKeys = new Set<string>();

	for (const sec of st.sections) {
		let key = sec.name;
		let n = 2;
		while (usedKeys.has(key)) key = `${sec.name}#${n++}`;
		usedKeys.add(key);

		const pts = seatsOf(sec, wrapOutlineFor(st, sec));
		const seats: FlatSeat[] = [];
		for (const p of pts) {
			if (sec.killed && sec.killed[p.key]) continue;
			const fl = sec.flat ? sec.flat[p.ci] : undefined;
			seats.push({
				localX: Math.round(p.x * 100) / 100,
				localY: Math.round(p.y * 100) / 100,
				row: fl?.row != null ? String(fl.row) : rowLabelFor(sec, p.ri),
				num: fl?.num != null ? Number(fl.num) : seatNumberFor(sec, p.ri, p.ci),
			});
		}
		out.push({ type: 'flat', key, label: sec.name, category: 'standard', x: 0, y: 0, seatSize: sec.seatSize, seats });
	}

	for (const z of st.zones) {
		const ga: GaSection = {
			type: 'ga',
			key: z.id,
			label: z.name,
			category: 'standard',
			x: z.x,
			y: z.y,
			width: z.w,
			height: z.h,
			capacity: z.cap,
		};
		out.push(ga);
	}

	return out;
}
