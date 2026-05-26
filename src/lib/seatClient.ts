import type { ISeatingSuggestResponse } from '@/types';
import { directSuggestSeats } from '@/lib/directApi';

export async function requestSuggest(
	slug: string,
	sessionId: number,
	items: Array<{ ticket_package_id: number; quantity: number }>
): Promise<ISeatingSuggestResponse> {
	return directSuggestSeats(slug, sessionId, items);
}
