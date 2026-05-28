export default function HomePageSkeleton() {
	return (
		<div className="bg-[var(--bg)]">
			{/* Hero split — left text card + right poster (3:4) */}
			<div className="mx-auto max-w-[1200px] px-4 pt-8 sm:px-5 md:px-8">
				<div className="grid overflow-hidden rounded-[22px] sm:rounded-[28px]" style={{ gridTemplateColumns: '1.05fr 1fr' }}>
					<div className="skeleton h-full min-h-[420px]" />
					<div className="skeleton" style={{ aspectRatio: '3 / 4' }} />
				</div>
			</div>

			{/* Category pills */}
			<div className="mx-auto max-w-[1200px] px-4 pb-5 pt-10 sm:px-5 md:px-8">
				<div className="flex gap-2">
					{[140, 120].map((w, i) => (
						<div key={i} className="skeleton h-[42px] rounded-full" style={{ width: w }} />
					))}
				</div>
			</div>

			{/* Event list */}
			<div className="mx-auto max-w-[1200px] px-4 pb-6 pt-9 sm:px-5 md:px-8">
				<div className="mb-6 flex items-end justify-between">
					<div className="skeleton h-9 w-56 rounded-xl" />
					<div className="skeleton h-3 w-24 rounded-md" />
				</div>
				<div className="grid grid-cols-1 gap-4">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="skeleton rounded-[22px]" style={{ height: 192 }} />
					))}
				</div>
			</div>
		</div>
	);
}
