import { addToast, closeToast } from '@heroui/react';

/**
 * Project-wide toast helper. Auto-dismisses on timeout (default 6s) and also
 * closes immediately when the user clicks anywhere on the toast.
 */
export function showToast(opts: Parameters<typeof addToast>[0]) {
	let key: string | null = null;
	key = addToast({
		...opts,
		classNames: { title: 'whitespace-normal', ...opts?.classNames },
		onClick() {
			if (key) closeToast(key);
		},
	} as Parameters<typeof addToast>[0]);
}
