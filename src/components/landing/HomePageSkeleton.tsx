export default function HomePageSkeleton() {
	return (
		<div className="bg-[var(--theme-bg)]">
			{/* Hero rectangle — mirrors HeroCarousel's 16/9 → 21/9 aspect */}
			<div className="mx-auto max-w-[1120px] px-4 pt-8 sm:px-6 md:pt-12">
				<div className="skeleton aspect-[16/9] w-full rounded-[22px] sm:rounded-[28px] lg:aspect-[21/9]" />

				{/* Title + meta + CTA row below image */}
				<div className="pt-4">
					<div className="skeleton h-9 w-2/3 rounded-xl sm:h-11" />
					<div className="mt-3 flex flex-wrap items-center gap-3">
						<div className="skeleton h-4 w-48 rounded-lg" />
						<div className="skeleton ml-auto h-11 w-40 rounded-full" />
					</div>
				</div>

				{/* "Also coming up" strip */}
				<div className="pt-8">
					<div className="skeleton mb-3 h-3 w-28 rounded-md" />
					<div className="flex gap-3 overflow-hidden">
						{[1, 2, 3].map((i) => (
							<div
								key={i}
								className="skeleton flex h-[76px] w-56 flex-shrink-0 rounded-2xl"
							/>
						))}
					</div>
				</div>
			</div>

			{/* CategoryFilter pills */}
			<div className="mx-auto mt-8 max-w-[1120px] px-4 sm:px-6">
				<div className="flex gap-2">
					{[64, 52, 80, 60].map((w, i) => (
						<div key={i} className={`skeleton h-8 rounded-full`} style={{ width: w }} />
					))}
				</div>
			</div>

			{/* EventGrid */}
			<div className="mx-auto mt-10 max-w-[1120px] px-4 sm:px-6 md:mt-12">
				{/* Section label */}
				<div className="mb-6 flex items-baseline justify-between">
					<div className="skeleton h-8 w-40 rounded-xl sm:h-9" />
					<div className="skeleton h-3 w-16 rounded-md" />
				</div>

				{/* Card grid — 2 col mobile, 4 col desktop */}
				<div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
					{Array.from({ length: 8 }).map((_, i) => (
						<div key={i} className="skeleton aspect-[3/4] w-full rounded-[22px]" />
					))}
				</div>
			</div>
		</div>
	);
}
