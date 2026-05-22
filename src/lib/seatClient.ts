// Browser-side seating calls. These hit our own Next API proxy (which holds the
// besttix x-api-key) — never besttix directly. Used for the on-page "re-pick"
// action; the first suggestion arrives via getServerSideProps.
import type { ISeatingSuggestResponse } from '@/types';

export async function requestSuggest(
	slug: string,
	sessionId: number,
	items: Array<{ ticket_package_id: number; quantity: number }>
): Promise<ISeatingSuggestResponse> {
	const res = await fetch(`/api/seating/${encodeURIComponent(slug)}/suggest`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ session_id: sessionId, items }),
	});
	if (!res.ok) throw new Error(`suggest failed: ${res.status}`);
	return res.json() as Promise<ISeatingSuggestResponse>;
}
