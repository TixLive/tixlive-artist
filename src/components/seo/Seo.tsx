import Head from 'next/head';

// Full <head> SEO block for crawlers that run JS and for real users — the client-side
// counterpart of functions/_lib/og.ts's injectHead(). Emits the same OG/Twitter/canonical
// set the edge bakes in for non-JS crawlers, so the two never diverge (see src/lib/seo.ts).
export interface SeoProps {
	/** Document <title>. */
	title: string;
	/** og:title / twitter:title. Defaults to `title` when omitted (the edge uses the bare
	 *  entity name here, e.g. the event title, not the "{title} — {org}" document title). */
	ogTitle?: string;
	/** Already-resolved + truncated description (use truncate() from src/lib/seo). */
	description?: string;
	/** Absolute canonical URL (also used for og:url). Undefined during SSG / before mount. */
	canonical?: string;
	image?: string | null;
	siteName?: string | null;
	ogType?: 'website' | 'article';
	/** schema.org entity to embed as JSON-LD (organizationLd / eventLd). */
	jsonLd?: object | null;
}

export default function Seo({
	title,
	ogTitle,
	description,
	canonical,
	image,
	siteName,
	ogType = 'website',
	jsonLd,
}: SeoProps) {
	const ot = ogTitle ?? title;
	const card = image ? 'summary_large_image' : 'summary';
	return (
		<Head>
			<title>{title}</title>
			{canonical && <link rel="canonical" href={canonical} />}
			{description && <meta name="description" content={description} />}
			<meta property="og:type" content={ogType} />
			{siteName && <meta property="og:site_name" content={siteName} />}
			{canonical && <meta property="og:url" content={canonical} />}
			<meta property="og:title" content={ot} />
			{description && <meta property="og:description" content={description} />}
			{image && <meta property="og:image" content={image} />}
			<meta name="twitter:card" content={card} />
			<meta name="twitter:title" content={ot} />
			{description && <meta name="twitter:description" content={description} />}
			{image && <meta name="twitter:image" content={image} />}
			{jsonLd && (
				<script
					type="application/ld+json"
					// Escape `<` so the payload can't break out of the <script> (mirrors ldjson() at the edge).
					dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
				/>
			)}
		</Head>
	);
}
