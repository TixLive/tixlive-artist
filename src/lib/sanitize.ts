import DOMPurify from 'isomorphic-dompurify';

// Mirror of besttix src/tools/sanitizeHtml.ts — keep the two allowlists in sync.
// Allowlist matches what the react-quill-new editor produces. No inline styles
// (clickjacking via fixed/full-viewport overlays), no event handlers, no target.
const ALLOWED_TAGS = [
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
];

const ALLOWED_ATTR = ['href', 'class'];

const ALLOWED_URI_REGEXP = /^(?:https?:|mailto:|tel:|#|\/)/i;

export function sanitizeHtml(input: string): string {
	return DOMPurify.sanitize(input, {
		ALLOWED_TAGS,
		ALLOWED_ATTR,
		FORBID_ATTR: ['style'],
		ALLOWED_URI_REGEXP,
	});
}
