// Host-aware robots.txt (`/robots.txt`).
// A Pages Function rather than a static file so the Sitemap line carries the
// correct per-tenant absolute URL (each white-label org runs on its own host).
interface Ctx {
	request: Request;
}

export async function onRequest({ request }: Ctx): Promise<Response> {
	const url = new URL(request.url);
	const body = [
		'User-agent: *',
		'Allow: /',
		'',
		'# Private/transactional areas — no search value',
		'Disallow: /account/',
		'Disallow: /checkout',
		'',
		`Sitemap: ${url.origin}/sitemap.xml`,
		'',
	].join('\n');

	return new Response(body, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			'Cache-Control': 'public, max-age=86400',
		},
	});
}
