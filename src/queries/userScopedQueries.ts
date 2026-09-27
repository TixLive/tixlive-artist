import type { QueryClient } from '@tanstack/react-query';
import { GetMeKey } from '@/queries/me/useGetMe';
import { GetMyOrdersKey } from '@/queries/orders/useGetMyOrders';
import { GetMyTicketKey } from '@/queries/tickets/useGetMyTicket';
import { GetMyTicketsKey } from '@/queries/tickets/useGetMyTickets';

/**
 * Query keys whose cached data belongs to one attendee's identity (name, orders,
 * tickets/QR codes). The QueryClient is a singleton for the whole SPA lifetime — it
 * is not recreated on in-app navigation — so on a device shared between buyers
 * (kiosk, family computer, borrowed phone), data left in these keys after sign-out
 * would flash the previous buyer's PII to whoever signs in next, until a background
 * refetch overwrites it. Clear this list on both edges of an identity change: on
 * sign-out (useAuth().signOut) and on a successful login (useValidateLoginCode).
 * Add any future query that reads a "my-*" endpoint here too.
 */
export const USER_SCOPED_QUERY_KEYS = [GetMeKey, GetMyOrdersKey, GetMyTicketsKey, GetMyTicketKey] as const;

export function clearUserScopedQueries(queryClient: QueryClient): void {
	for (const key of USER_SCOPED_QUERY_KEYS) {
		queryClient.removeQueries({ queryKey: [key] });
	}
}
