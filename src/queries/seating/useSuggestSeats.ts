import { useMutation } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import type { ISeatingSuggestResponse } from '@/types';

interface SuggestParams {
	slug: string;
	sessionId: number;
	items: Array<{ ticket_package_id: number; quantity: number }>;
}

export const useSuggestSeats = () => {
	return useMutation({
		mutationFn: async ({ slug, sessionId, items }: SuggestParams) =>
			ApiService.post<ISeatingSuggestResponse>(`/api/public/seating/${encodeURIComponent(slug)}/suggest`, {
				session_id: sessionId,
				items,
			}),
	});
};

export async function suggestSeats(
	slug: string,
	sessionId: number,
	items: Array<{ ticket_package_id: number; quantity: number }>
): Promise<ISeatingSuggestResponse> {
	return ApiService.post<ISeatingSuggestResponse>(`/api/public/seating/${encodeURIComponent(slug)}/suggest`, {
		session_id: sessionId,
		items,
	});
}
