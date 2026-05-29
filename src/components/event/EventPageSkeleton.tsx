export default function EventPageSkeleton() {
	return (
		<div className="bg-[var(--bg)]">
			{/* Hero stack — square poster on mobile, 3:1 banner on ≥640px + title zone */}
			<div className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-5 md:px-8">
				<div className="overflow-hidden rounded-[22px] sm:rounded-[28px]">
					<div className="skeleton aspect-square w-full sm:aspect-[3/1]" />
					<div className="skeleton h-[96px] w-full sm:h-[120px]" />
				</div>
			</div>

			<div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-4 pb-10 pt-10 sm:px-5 md:gap-[56px] md:px-8">
				<section className="grid grid-cols-1 gap-7 md:gap-14 lg:grid-cols-[minmax(0,1fr)_380px]">
					{/* Left */}
					<div className="flex flex-col gap-12">
						<div>
							<div className="skeleton h-8 w-48 rounded-xl" />
							<div className="mt-4 flex flex-col gap-2.5">
								{[100, 100, 80, 100, 70, 90].map((w, i) => (
									<div key={i} className="skeleton h-4 rounded-lg" style={{ width: `${w}%` }} />
								))}
							</div>
						</div>
						<div>
							<div className="skeleton h-8 w-32 rounded-xl" />
							<div className="skeleton mt-4 h-[280px] w-full rounded-2xl" />
						</div>
					</div>

					{/* Right sidebar */}
					<div className="flex flex-col gap-3">
						<div className="overflow-hidden rounded-[22px]" style={{ boxShadow: 'var(--shadow-float)' }}>
							{[0, 1, 2].map((i) => (
								<div key={i}>
									<div className="bg-[var(--surface)] px-5 py-4">
										<div className="skeleton h-2.5 w-12 rounded-md" />
										<div className="skeleton mt-2 h-5 w-48 rounded-lg" />
										<div className="skeleton mt-1.5 h-3.5 w-36 rounded-md" />
									</div>
									{i < 2 && <div className="h-px bg-[var(--line)]" />}
								</div>
							))}
						</div>
						<div className="skeleton h-[52px] w-full rounded-full" />
						<div className="skeleton h-[48px] w-full rounded-full" />
						<div className="mt-1 flex flex-col gap-2">
							{[1, 2, 3].map((i) => (
								<div key={i} className="flex items-center gap-3 rounded-[14px] bg-[var(--surface-elev)] px-4 py-[14px]">
									<div className="skeleton h-9 w-9 shrink-0 rounded-[10px]" />
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
