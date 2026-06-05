/**
 * Event date/time formatting in the VENUE's timezone.
 *
 * Event datetimes arrive from the API as absolute ISO strings (UTC instant)
 * plus an IANA `timezone` (e.g. "Europe/Bucharest"). The time we must show is
 * always the venue's local time — never the viewer's browser timezone. Passing
 * the IANA zone to `Intl` via the `timeZone` option does exactly that, and it
 * also resolves DST correctly for the specific date.
 *
 * If `timeZone` is missing (older API payload), every helper falls back to the
 * browser's local zone, preserving the previous behavior rather than throwing.
 */

/** Guard against an invalid/unknown IANA name reaching Intl (which throws). */
function safeZone(timeZone?: string | null): string | undefined {
	if (!timeZone) return undefined;
	try {
		// Throws RangeError for an unknown zone; cheap to construct.
		new Intl.DateTimeFormat('en-US', { timeZone });
		return timeZone;
	} catch {
		return undefined;
	}
}

/** e.g. "Sâmbătă, 14 iun. 2026" (locale-driven). */
export function formatEventDate(
	iso: string,
	timeZone: string | undefined | null,
	locale: string,
	options?: Intl.DateTimeFormatOptions
): string {
	if (!iso) return '';
	return new Date(iso).toLocaleDateString(locale, {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: safeZone(timeZone),
		...options,
	});
}

/**
 * The individual date pieces (weekday/day/month/year) in the venue timezone —
 * for badges/strips that lay each part out separately. Computing them with
 * `formatToParts` (timeZone-aware) avoids the classic bug of reading
 * `date.getDate()` / `getFullYear()`, which use the browser's local zone.
 */
export function formatEventDateParts(
	iso: string,
	timeZone: string | undefined | null,
	locale: string,
	opts?: { weekday?: 'short' | 'long'; month?: 'short' | 'long' }
): { weekday: string; day: string; month: string; year: string } {
	const empty = { weekday: '', day: '', month: '', year: '' };
	if (!iso) return empty;
	const parts = new Intl.DateTimeFormat(locale, {
		weekday: opts?.weekday ?? 'short',
		day: 'numeric',
		month: opts?.month ?? 'short',
		year: 'numeric',
		timeZone: safeZone(timeZone),
	}).formatToParts(new Date(iso));
	const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
	return { weekday: get('weekday'), day: get('day'), month: get('month'), year: get('year') };
}

/** e.g. "19:00" — 24-hour, in the venue timezone. */
export function formatEventTime(iso: string, timeZone: string | undefined | null, locale: string): string {
	if (!iso) return '';
	return new Date(iso).toLocaleTimeString(locale, {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false,
		timeZone: safeZone(timeZone),
	});
}

/**
 * GMT offset label for the given instant in the given zone, e.g. "GMT+2".
 * Uses `timeZoneName: 'shortOffset'` (yields "GMT+2" / "GMT+5:30") and is
 * DST-correct because it is computed for the specific date. Returns '' when
 * the zone is unknown/missing (so callers can omit the suffix entirely).
 */
export function formatGmtOffset(iso: string, timeZone: string | undefined | null): string {
	const zone = safeZone(timeZone);
	if (!iso || !zone) return '';
	try {
		const parts = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'shortOffset' }).formatToParts(
			new Date(iso)
		);
		const name = parts.find((p) => p.type === 'timeZoneName')?.value ?? '';
		// Normalize "UTC+2" / "GMT+02" variants to a clean "GMT+2".
		return name.replace(/^UTC/, 'GMT').replace(/GMT([+-])0(\d)/, 'GMT$1$2');
	} catch {
		return '';
	}
}

/** e.g. "19:00 (GMT+2)" — time in the venue zone with an offset hint. */
export function formatEventTimeWithZone(iso: string, timeZone: string | undefined | null, locale: string): string {
	const time = formatEventTime(iso, timeZone, locale);
	if (!time) return '';
	const offset = formatGmtOffset(iso, timeZone);
	return offset ? `${time} (${offset})` : time;
}
