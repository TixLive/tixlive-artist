import { useQuery } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import type { ITicket } from '@/types';

export const GetMyTicketKey = 'my-ticket';

type Params = {
	ticketId: string | null;
	enabled?: boolean;
};

export const useGetMyTicket = ({ ticketId, enabled = true }: Params) => {
	return useQuery({
		queryKey: [GetMyTicketKey, ticketId],
		queryFn: async () => ApiService.get<ITicket>(`/api/public/tickets/${encodeURIComponent(ticketId!)}`),
		enabled: !!ticketId && enabled,
		retry: 0,
	});
};
