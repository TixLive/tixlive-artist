/**
 * Pick the organizer's custom page title for the active locale. Falls back to the
 * site fallback locale, then to ANY locale a custom title was set in — so a rename
 * entered in a single language still shows on a site rendered in another. Returns ''
 * when no custom title exists, letting the caller use its default label.
 */
export function pickTitle(
	title: Record<string, string> | undefined | null,
	locale: string,
	fallback = 'ro'
): string {
	if (!title) return '';
	return (
		title[locale]?.trim() ||
		title[fallback]?.trim() ||
		Object.values(title)
			.map((v) => v?.trim())
			.find(Boolean) ||
		''
	);
}
