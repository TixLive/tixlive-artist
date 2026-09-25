import { describe, it, expect, afterEach, vi } from 'vitest';

// A Response built by hand in a Pages Function (new Response(body, { headers }))
// never passes through Cloudflare's ASSETS pipeline, so it never picks up the
// security headers that pipeline applies (public/_headers' Strict-Transport-Security,
// plus the platform's own X-Content-Type-Options/Referrer-Policy defaults on asset
// responses) — see functions/_lib/og.ts's SECURITY_HEADERS. sitemap.xml.ts and
// robots.txt.ts are the two functions that build a Response this way; both must
// spread SECURITY_HEADERS in, or they ship with none of the three.

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('sitemap.xml security headers', () => {
	it('carries HSTS/nosniff/referrer-policy on its hand-built Response', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(JSON.stringify({ data: [], next_offset: null }), { status: 200 })),
		);
		const { onRequest } = await import('../../functions/sitemap.xml');
		const res = await onRequest({
			request: new Request('https://bilete.example.ro/sitemap.xml'),
			env: {},
		});
		expect(res.headers.get('Strict-Transport-Security')).toBe('max-age=31536000');
		expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
		expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
	});
});

describe('robots.txt security headers', () => {
	it('carries HSTS/nosniff/referrer-policy on its hand-built Response', async () => {
		const { onRequest } = await import('../../functions/robots.txt');
		const res = await onRequest({ request: new Request('https://bilete.example.ro/robots.txt') });
		expect(res.headers.get('Strict-Transport-Security')).toBe('max-age=31536000');
		expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
		expect(res.headers.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');
	});
});
