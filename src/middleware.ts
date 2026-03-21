import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
	const attendeeSession = request.cookies.get('attendee_session');

	if (!attendeeSession) {
		return NextResponse.redirect(new URL('/', request.url));
	}

	return NextResponse.next();
}

export const config = {
	matcher: ['/my-tickets/:path*'],
};
