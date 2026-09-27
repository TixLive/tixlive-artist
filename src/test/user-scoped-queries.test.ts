// T3560: signing out (or signing in as someone else) on a shared device must not leave
// a previous buyer's orders/tickets sitting in the QueryClient — it's a singleton for
// the whole SPA lifetime, so leftover cache flashes one attendee's PII to the next
// until a background refetch overwrites it. Two layers pinned here:
//  - `clearUserScopedQueries` itself actually drops the right keys and nothing else;
//  - `AuthContext.signOut` and `useValidateLoginCode` (login success) both call it —
//    a source-grep, since this repo has no DOM testing library to render the hooks.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { QueryClient } from '@tanstack/react-query';
import { clearUserScopedQueries, USER_SCOPED_QUERY_KEYS } from '@/queries/userScopedQueries';
import { GetMeKey } from '@/queries/me/useGetMe';
import { GetMyOrdersKey } from '@/queries/orders/useGetMyOrders';
import { GetMyTicketsKey } from '@/queries/tickets/useGetMyTickets';
import { GetMyTicketKey } from '@/queries/tickets/useGetMyTicket';
import { GetEventsKey } from '@/queries/events/useGetEvents';

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel: string) => fs.readFileSync(path.join(SRC, rel), 'utf8');

function seededClient() {
	const queryClient = new QueryClient();
	queryClient.setQueryData([GetMeKey], { id: 1, email: 'buyer-a@example.com' });
	queryClient.setQueryData([GetMyOrdersKey], { pages: [{ items: ['order-a'] }], pageParams: [0] });
	queryClient.setQueryData([GetMyTicketsKey], { pages: [{ items: ['ticket-a'] }], pageParams: [0] });
	queryClient.setQueryData([GetMyTicketKey, 'ticket-42'], { id: 'ticket-42', qr: 'v2.deadbeef' });
	queryClient.setQueryData([GetEventsKey, 'upcoming'], { pages: [{ items: [{ slug: 'some-event' }] }], pageParams: [0] });
	return queryClient;
}

describe('clearUserScopedQueries', () => {
	it("lists exactly the keys that carry one attendee's identity", () => {
		expect(USER_SCOPED_QUERY_KEYS).toEqual([GetMeKey, GetMyOrdersKey, GetMyTicketsKey, GetMyTicketKey]);
	});

	it('drops me/orders/tickets from the cache', () => {
		const queryClient = seededClient();
		clearUserScopedQueries(queryClient);

		expect(queryClient.getQueryData([GetMeKey])).toBeUndefined();
		expect(queryClient.getQueryData([GetMyOrdersKey])).toBeUndefined();
		expect(queryClient.getQueryData([GetMyTicketsKey])).toBeUndefined();
	});

	it('drops every cached single-ticket entry regardless of ticket id', () => {
		const queryClient = seededClient();
		queryClient.setQueryData([GetMyTicketKey, 'ticket-7'], { id: 'ticket-7' });
		clearUserScopedQueries(queryClient);

		expect(queryClient.getQueryData([GetMyTicketKey, 'ticket-42'])).toBeUndefined();
		expect(queryClient.getQueryData([GetMyTicketKey, 'ticket-7'])).toBeUndefined();
	});

	it('leaves organizer-scoped, non-personal queries alone', () => {
		const queryClient = seededClient();
		clearUserScopedQueries(queryClient);

		expect(queryClient.getQueryData([GetEventsKey, 'upcoming'])).toEqual({
			pages: [{ items: [{ slug: 'some-event' }] }],
			pageParams: [0],
		});
	});
});

describe('both edges of an identity change clear the cache', () => {
	it('signOut() clears user-scoped queries alongside the tokens', () => {
		const authContext = read('contexts/AuthContext.tsx');
		expect(authContext).toMatch(/import \{ clearUserScopedQueries \} from '@\/queries\/userScopedQueries';/);
		expect(authContext).toMatch(/const signOut = useCallback\(\(\) => \{\s*clearTokens\(\);\s*clearUserScopedQueries\(queryClient\);/);
	});

	it('a successful login clears user-scoped queries too, as a safety net', () => {
		const validateLoginCode = read('queries/auth/useValidateLoginCode.ts');
		expect(validateLoginCode).toMatch(/import \{ clearUserScopedQueries \} from '@\/queries\/userScopedQueries';/);
		expect(validateLoginCode).toMatch(/onSuccess: \(\) => \{\s*[\s\S]*?clearUserScopedQueries\(queryClient\);\s*\},/);
	});
});
