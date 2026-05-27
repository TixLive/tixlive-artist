import { useQuery } from '@tanstack/react-query';
import ApiService from '@/services/Api.Service';
import type { ITicket } from '@/types';

export const GetMyTicketsKey = 'my-tickets';

type Params = {
	enabled?: boolean;
};

export const useGetMyTickets = ({ enabled = true }: Params = {}) => {
	return useQuery({
		queryKey: [GetMyTicketsKey],
		queryFn: async () => ApiService.get<ITicket[]>('/api/public/tickets'),
		enabled,
		retry: 0,
	});
};
