/** Loading placeholder for the checkout page — mirrors the two-column layout so
 *  the buyer sees structure instead of a blank screen while the event loads. */
export default function CheckoutSkeleton() {
	return (
		<div className="mx-auto max-w-[1200px] px-4 pb-12 pt-7 sm:px-5 md:px-8">
			{/* Back pill */}
			<div className="skeleton mb-5 h-4 w-20 rounded-md" />

			{/* Heading */}
			<div className="mb-7">
				<div className="skeleton h-8 w-64 rounded-xl sm:h-9" />
				<div className="skeleton mt-2.5 h-4 w-72 rounded-md" />
			</div>

			<div className="grid gap-7 md:grid-cols-[1fr_380px] md:items-start md:gap-10">
				{/* Left column — form */}
				<div className="min-w-0 space-y-4">
					{/* Personal data card */}
					<div className="rounded-[18px] bg-[var(--surface)] p-5 sm:p-6" style={{ boxShadow: 'var(--shadow-2)' }}>
						<div className="skeleton h-6 w-40 rounded-lg" />
						<div className="skeleton mt-2 h-3.5 w-56 rounded-md" />
						<div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div className="skeleton h-[56px] rounded-xl" />
							<div className="skeleton h-[56px] rounded-xl" />
						</div>
						<div className="skeleton mt-4 h-[56px] rounded-xl" />
						<div className="skeleton mt-4 h-[56px] rounded-xl" />
					</div>

					{/* Promo */}
					<div className="skeleton h-[64px] rounded-[18px]" />

					{/* Payment methods */}
					<div className="space-y-2.5">
						<div className="skeleton h-[60px] rounded-[14px]" />
						<div className="skeleton h-[60px] rounded-[14px]" />
					</div>

					{/* Consent rows */}
					<div className="skeleton h-[44px] rounded-[12px]" />
					<div className="skeleton h-[44px] rounded-[12px]" />

					{/* CTA */}
					<div className="skeleton mt-1 h-[56px] w-full rounded-full" />
				</div>

				{/* Right column — sticky order summary (desktop only) */}
				<aside className="hidden flex-shrink-0 md:block">
					<div className="flex flex-col gap-3">
						<div className="overflow-hidden rounded-[18px] bg-[var(--surface)]" style={{ boxShadow: 'var(--shadow-2)' }}>
							<div className="flex items-center gap-3.5 border-b border-[var(--line)] p-4">
								<div className="skeleton h-[72px] w-[54px] shrink-0 rounded-[10px]" />
								<div className="min-w-0 flex-1">
									<div className="skeleton h-2.5 w-12 rounded-md" />
									<div className="skeleton mt-2 h-4 w-40 rounded-md" />
									<div className="skeleton mt-1.5 h-3 w-32 rounded-md" />
								</div>
							</div>
							<div className="flex flex-col gap-3 p-4">
								<div className="skeleton h-4 w-full rounded-md" />
								<div className="skeleton h-4 w-3/4 rounded-md" />
							</div>
						</div>
						<div className="skeleton h-[160px] rounded-[18px]" />
					</div>
				</aside>
			</div>
		</div>
	);
}
