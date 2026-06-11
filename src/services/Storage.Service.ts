/**
 * SSR-safe, JSON-typed wrapper over `localStorage`.
 *
 * Centralises the `typeof window` guard and the try/catch every browser-storage
 * access needs (private mode / quota errors throw). Reads return `null` on any
 * failure and writes are best-effort, so callers never have to handle storage
 * exceptions themselves.
 */

const StorageService = {
	get<T>(key: string): T | null {
		if (typeof window === 'undefined') return null;
		try {
			const raw = window.localStorage.getItem(key);
			return raw ? (JSON.parse(raw) as T) : null;
		} catch {
			return null;
		}
	},
	set<T>(key: string, value: T): void {
		if (typeof window === 'undefined') return;
		try {
			window.localStorage.setItem(key, JSON.stringify(value));
		} catch {
			/* storage disabled / over quota — writes are best-effort */
		}
	},
	remove(key: string): void {
		if (typeof window === 'undefined') return;
		try {
			window.localStorage.removeItem(key);
		} catch {
			/* ignore */
		}
	},
};

export default StorageService;
