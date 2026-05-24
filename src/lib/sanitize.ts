import sanitizeHtmlLib from 'sanitize-html';

// Render-side HTML hardening, semantically mirrored from besttix src/tools/sanitizeHtml.ts.
// Uses sanitize-html (pure Node, no jsdom) so it can't blow up in the serverless/
// white-label runtime the way isomorphic-dompurify does. Allowlist matches what the
// react-quill-new editor produces: formatting tags + safe links. No inline styles,
// no event handlers, no target.
const OPTIONS: sanitizeHtmlLib.IOptions = {
	allowedTags: [
		'p',
		'br',
		'span',
		'strong',
		'b',
		'em',
		'i',
		'u',
		's',
		'strike',
		'sub',
		'sup',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'ul',
		'ol',
		'li',
		'blockquote',
		'pre',
		'code',
		'hr',
		'a',
	],
	allowedAttributes: {
		a: ['href'],
		'*': ['class'],
	},
	allowedSchemes: ['http', 'https', 'mailto', 'tel'],
	allowProtocolRelative: false,
};

export function sanitizeHtml(input: string): string {
	return sanitizeHtmlLib(input, OPTIONS);
}
