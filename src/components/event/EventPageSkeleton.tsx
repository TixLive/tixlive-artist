export default function EventPageSkeleton() {
	const hairline = 'border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)]';

	return (
		<div className="bg-[var(--theme-bg)]">
			{/* EventHero — 16/9 → 21/9 rectangle + title below */}
			<div className="mx-auto max-w-[1120px] px-4 pt-8 sm:px-6 md:pt-12">
				<div className="skeleton aspect-[16/9] w-full rounded-[22px] sm:rounded-[28px] lg:aspect-[21/9]" />

				<div className="pt-5">
					<div className="skeleton h-10 w-3/4 rounded-xl sm:h-14" />
					<div className="skeleton mt-2 h-10 w-1/2 rounded-xl sm:h-14" />
				</div>
			</div>

			{/* About + buy card section */}
			<div className="mx-auto flex max-w-[1120px] flex-col gap-10 px-4 py-10 sm:px-6 md:gap-[72px] md:py-16">
				<section className="grid gap-8 md:grid-cols-[1.6fr_1fr] md:items-start md:gap-14">
					{/* Left — description blocks */}
					<div className="flex flex-col gap-10">
						<div>
							<div className="skeleton h-8 w-48 rounded-xl" />
							<div className="mt-4 flex flex-col gap-2.5">
								<div className="skeleton h-4 w-full rounded-lg" />
								<div className="skeleton h-4 w-full rounded-lg" />
								<div className="skeleton h-4 w-5/6 rounded-lg" />
								<div className="skeleton h-4 w-full rounded-lg" />
								<div className="skeleton h-4 w-3/4 rounded-lg" />
								<div className="skeleton h-4 w-full rounded-lg" />
							</div>
						</div>
						<div>
							<div className="skeleton h-8 w-32 rounded-xl" />
							<div className="skeleton mt-4 h-[280px] w-full rounded-2xl" />
						</div>
					</div>

					{/* Right — buy card */}
					<div className="flex flex-col gap-4">
						<div
							className={`overflow-hidden rounded-[22px] border ${hairline} bg-[var(--theme-surface)] shadow-[0_1px_2px_rgba(20,19,18,0.04),0_8px_24px_rgba(20,19,18,0.06)]`}
						>
							<div className="px-6">
								<div className={`border-b ${hairline} py-4`}>
									<div className="skeleton h-2.5 w-12 rounded-md" />
									<div className="skeleton mt-2 h-5 w-48 rounded-lg" />
									<div className="skeleton mt-1.5 h-3.5 w-36 rounded-md" />
								</div>
								<div className={`border-b ${hairline} py-4`}>
									<div className="skeleton h-2.5 w-16 rounded-md" />
									<div className="skeleton mt-2 h-5 w-40 rounded-lg" />
									<div className="skeleton mt-1.5 h-3.5 w-28 rounded-md" />
								</div>
								<div className="py-4">
									<div className="skeleton h-2.5 w-10 rounded-md" />
									<div className="skeleton mt-2 h-5 w-32 rounded-lg" />
									<div className="skeleton mt-1.5 h-3.5 w-20 rounded-md" />
								</div>
							</div>
							<div className={`flex flex-col gap-2.5 border-t ${hairline} bg-[var(--theme-bg)] px-5 py-4`}>
								<div className="skeleton h-11 w-full rounded-full" />
								<div className="skeleton h-11 w-full rounded-full" />
							</div>
						</div>

						{/* Trust badges */}
						<div className="flex flex-col gap-2">
							{[1, 2, 3].map((i) => (
								<div
									key={i}
									className={`flex items-center gap-3 rounded-2xl border ${hairline} bg-[var(--theme-surface)] px-4 py-3`}
								>
									<div className="skeleton h-6 w-6 flex-shrink-0 rounded-lg" />
									<div className="flex flex-col gap-1.5">
										<div className="skeleton h-3.5 w-28 rounded-md" />
										<div className="skeleton h-2.5 w-16 rounded-md" />
									</div>
								</div>
							))}
						</div>
					</div>
				</section>
			</div>
		</div>
	);
}
