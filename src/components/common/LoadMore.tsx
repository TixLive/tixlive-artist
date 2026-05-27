import { useTranslation } from 'next-i18next';
import { Button } from '@heroui/react';
import { Icon } from '@iconify/react';

type LoadMoreProps = {
	hasNextPage: boolean;
	isFetching: boolean;
	isError?: boolean;
	onLoadMore: () => void | Promise<unknown>;
	/** Override the button label. Defaults to `common.load_more`. */
	label?: string;
};

/**
 * Pagination Load More button + inline error state. Used by paginated
 * lists (orders, tickets, landing events).
 *
 * Renders nothing when there's no next page and no error to surface.
 */
export default function LoadMore({ hasNextPage, isFetching, isError, onLoadMore, label }: LoadMoreProps) {
	const { t } = useTranslation('common');

	if (!hasNextPage && !isError) return null;

	return (
		<div className="mt-10 flex flex-col items-center gap-3 pb-8">
			{isError && (
				<p className="flex items-center gap-2 font-[family-name:var(--font-body)] text-[0.875rem] text-[color-mix(in_srgb,var(--theme-text)_70%,transparent)]">
					<Icon icon="mdi:alert-circle-outline" width={16} aria-hidden />
					{t('common.load_more_error')}
				</p>
			)}
			<Button
				variant="bordered"
				radius="full"
				className="border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)] px-8 font-[family-name:var(--font-body)] font-[600] text-[var(--theme-text)] shadow-[0_1px_2px_rgba(20,19,18,0.04),0_8px_24px_rgba(20,19,18,0.06)] transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--theme-text)_18%,transparent)]"
				onPress={() => {
					void onLoadMore();
				}}
				isLoading={isFetching}
			>
				{isError ? t('common.try_again') : (label ?? t('common.load_more'))}
			</Button>
		</div>
	);
}
