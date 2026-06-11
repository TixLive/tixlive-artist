// Minimal ambient types for the Cloudflare Pages runtime globals used by the
// OG-injection functions. These run on Cloudflare's Workers runtime (compiled
// separately by Pages), so they aren't part of the Next/DOM lib. We only declare
// the surface we actually use rather than pulling in @cloudflare/workers-types.

interface HTMLRewriterElement {
	remove(): void;
	append(content: string, opts?: { html?: boolean }): void;
	setInnerContent(content: string, opts?: { html?: boolean }): void;
}

interface HTMLRewriterHandlers {
	element?(element: HTMLRewriterElement): void;
}

declare class HTMLRewriter {
	on(selector: string, handlers: HTMLRewriterHandlers): HTMLRewriter;
	transform(response: Response): Response;
}

// Static-asset binding available to Pages Functions — serves files from `out/`.
interface AssetsFetcher {
	fetch(input: Request | URL | string): Promise<Response>;
}
