import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@iconify/react';
import { useTranslation } from 'next-i18next';
import { IArchiveStats, IEventListItem } from '@/types';
import { usePrefetchEvent } from '@/hooks/usePrefetchEvent';
import { formatEventDate, formatEventDateParts } from '@/lib/datetime';

interface ArchiveTimelineProps {
	events: IEventListItem[];
	/** Organizer-wide aggregates for the header. When absent, the numbers are derived
	 *  from the loaded pages (accurate only once everything is paged in). */
	stats?: IArchiveStats;
}

export default function ArchiveTimeline({ events, stats }: ArchiveTimelineProps) {
	const { t, i18n } = useTranslation('common');
	const prefetch = usePrefetchEvent();
	const locale = i18n.language;

	const yearOf = (e: IEventListItem) =>
		Number(
			formatEventDateParts(e.date_start, e.timezone, locale, { month: 'short' })
				.year,
		);

	const { groups, years, cities, span } = useMemo(() => {
		const byYear = new Map<number, IEventListItem[]>();
		for (const e of events) {
			const y = yearOf(e);
			if (!byYear.has(y)) byYear.set(y, []);
			byYear.get(y)!.push(e);
		}
		const years = [...byYear.keys()].sort((a, b) => b - a);
		const citySet = new Set(
			events.map((e) => e.city).filter(Boolean) as string[],
		);
		const minYear = years.length ? Math.min(...years) : null;
		const maxYear = years.length ? Math.max(...years) : null;
		// Collapse a single-year span to "2026" (not "2026–2026"), matching the
		// server-stats formatting so the header doesn't flicker once stats arrive.
		const span = minYear == null ? '' : minYear === maxYear ? String(minYear) : `${minYear}–${maxYear}`;
		return { groups: byYear, years, cities: citySet.size, span };
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [events, locale]);

	// Prefer organizer-wide aggregates from the BE; fall back to the loaded-pages
	// derivation so the header still renders before/without the stats call.
	const statEvents = stats?.total_past ?? events.length;
	const statCities = stats?.distinct_cities ?? cities;
	const statSpan =
		stats?.year_min != null && stats?.year_max != null
			? stats.year_min === stats.year_max
				? String(stats.year_min)
				: `${stats.year_min}–${stats.year_max}`
			: span;

	const formatDate = (e: IEventListItem) =>
		formatEventDate(e.date_start, e.timezone, locale, {
			weekday: undefined,
			day: 'numeric',
			month: 'short',
			year: 'numeric',
		}).toUpperCase();

	let runningIdx = 0;

	return (
		<div className="archive-tl mx-auto max-w-[1160px] px-4 sm:px-5 md:px-8">
			<style>{`
				.archive-tl .tl-intro { padding: 64px 0 34px; }
				.archive-tl .tl-eyebrow { font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: var(--ink-4); }
				.archive-tl .tl-h1 { font-size: clamp(36px, 5.4vw, 60px); font-weight: 800; letter-spacing: -.038em; line-height: 1; margin: 20px 0 0; max-width: 14ch; text-wrap: balance; color: var(--ink); }
				.archive-tl .tl-lead { margin-top: 18px; color: var(--ink-3); font-size: 16px; font-weight: 500; letter-spacing: -.01em; max-width: 46ch; line-height: 1.5; }
				.archive-tl .tl-stats { display: flex; gap: 26px; margin-top: 30px; flex-wrap: wrap; }
				.archive-tl .tl-stat { display: flex; flex-direction: column; gap: 5px; }
				.archive-tl .tl-stat .n { font-family: var(--font-mono); font-size: 26px; font-weight: 700; letter-spacing: -.02em; color: var(--ink); white-space: nowrap; }
				.archive-tl .tl-stat .l { font-size: 12px; font-weight: 600; letter-spacing: -.01em; color: var(--ink-3); }
				.archive-tl .tl-stat-div { width: 1px; align-self: stretch; background: var(--line); }

				.archive-tl .timeline { padding: 18px 0 0; }
				.archive-tl .tl-now { display: grid; grid-template-columns: 132px 1fr; gap: 36px; align-items: start; }
				.archive-tl .tl-now-items { position: relative; padding-bottom: 14px; }
				.archive-tl .tl-now-row { display: grid; grid-template-columns: 12px 1fr; gap: 30px; align-items: center; }
				.archive-tl .tl-now-row .node { position: relative; z-index: 1; width: 13px; height: 13px; border-radius: 50%; background: var(--ink); margin: 0 auto; box-shadow: 0 0 0 5px color-mix(in srgb, var(--ink) 9%, transparent); }
				.archive-tl .tl-now-row .lbl { font-family: var(--font-mono); font-size: 11px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: var(--ink-3); }

				.archive-tl .tl-group { display: grid; grid-template-columns: 132px 1fr; gap: 36px; align-items: start; }
				.archive-tl .tl-year { position: sticky; top: 96px; align-self: start; text-align: right; padding-top: 2px; }
				.archive-tl .tl-year .yn { font-family: var(--font-mono); font-size: 42px; font-weight: 700; letter-spacing: -.03em; line-height: .9; color: var(--ink); }
				.archive-tl .tl-year .yc { font-family: var(--font-mono); font-size: 10px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; color: var(--ink-4); margin-top: 10px; }

				.archive-tl .tl-items { position: relative; }
				.archive-tl .tl-items::before { content: ""; position: absolute; left: 6px; top: 4px; bottom: 0; width: 1px; background: var(--line); z-index: 0; }
				.archive-tl .tl-group:last-of-type .tl-items::before { bottom: 18px; }

				.archive-tl .tl-item { display: grid; grid-template-columns: 12px 1fr; gap: 30px; position: relative; padding-bottom: 34px; }
				.archive-tl .tl-item .node { position: relative; z-index: 1; width: 11px; height: 11px; border-radius: 50%; background: var(--bg); border: 1.6px solid var(--ink-4); margin-top: 6px; transition: .3s; }
				.archive-tl .tl-item.sold .node { background: var(--ink); border-color: var(--ink); }
				.archive-tl .tl-item:hover .node { border-color: var(--ink); transform: scale(1.18); }

				.archive-tl .tl-card { display: grid; grid-template-columns: 140px 1fr; gap: 24px; align-items: center; padding: 14px; margin: -14px; border-radius: 22px; border: 1px solid transparent; transition: background .3s, box-shadow .3s, border-color .3s, transform .3s cubic-bezier(.2,.7,.3,1); }
				.archive-tl .tl-item:hover .tl-card { background: var(--surface); border-color: var(--line); box-shadow: var(--shadow-2); transform: translateY(-2px); }

				.archive-tl .tl-poster { position: relative; width: 140px; aspect-ratio: 16/11; border-radius: 12px; overflow: hidden; background: #0A0A0A; flex: none; }
				.archive-tl .tl-poster .poster-img { filter: grayscale(1) brightness(1.03); opacity: .88; transition: filter .5s cubic-bezier(.2,.7,.3,1), opacity .5s; }
				.archive-tl .tl-item:hover .tl-poster .poster-img { filter: none; opacity: 1; }
				.archive-tl .tl-stamp { position: absolute; left: 7px; bottom: 7px; height: 21px; padding: 0 8px; border-radius: 6px; display: inline-flex; align-items: center; background: rgba(10,10,10,.6); backdrop-filter: blur(4px); white-space: nowrap; font-family: var(--font-mono); font-size: 8.5px; font-weight: 700; letter-spacing: .12em; color: #fff; text-transform: uppercase; }

				.archive-tl .tl-body { min-width: 0; }
				.archive-tl .tl-date { font-family: var(--font-mono); font-size: 10.5px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; color: var(--ink-4); }
				.archive-tl .tl-recent { display: inline-flex; align-items: center; height: 20px; padding: 0 9px; border-radius: 6px; margin-left: 9px; white-space: nowrap; background: var(--ink); color: #fff; font-family: var(--font-mono); font-size: 8.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; vertical-align: middle; }
				.archive-tl .tl-title { font-size: 21px; font-weight: 700; letter-spacing: -.022em; line-height: 1.16; color: var(--ink); margin: 8px 0 9px; text-wrap: pretty; }
				.archive-tl .tl-meta { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; color: var(--ink-3); font-size: 14px; font-weight: 500; letter-spacing: -.01em; }
				.archive-tl .tl-meta .m { display: inline-flex; align-items: center; gap: 6px; }
				.archive-tl .tl-dot { width: 3px; height: 3px; border-radius: 50%; background: var(--ink-4); }
				.archive-tl .tl-actions { display: flex; align-items: center; gap: 16px; margin-top: 14px; }
				.archive-tl .tl-gal { display: inline-flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 600; color: var(--ink-2); letter-spacing: -.01em; transition: .18s; }
				.archive-tl .tl-gal .gal-ic { transition: transform .22s cubic-bezier(.2,.7,.3,1); }
				.archive-tl .tl-item:hover .tl-gal { color: var(--ink); }
				.archive-tl .tl-item:hover .tl-gal .gal-ic { transform: translateX(3px); }

				@keyframes archive-tl-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
				@media (prefers-reduced-motion: no-preference) {
					.archive-tl .tl-item, .archive-tl .tl-now-row { animation: archive-tl-up .6s cubic-bezier(.2,.7,.3,1) both; }
				}
				@media (max-width: 760px) {
					.archive-tl .tl-now, .archive-tl .tl-group { grid-template-columns: 1fr; gap: 10px; }
					.archive-tl .tl-year { position: static; text-align: left; display: flex; align-items: baseline; gap: 14px; padding: 6px 0 14px; }
					.archive-tl .tl-year .yc { margin-top: 0; }
					.archive-tl .tl-card { grid-template-columns: 1fr; gap: 14px; }
					.archive-tl .tl-poster { width: 100%; aspect-ratio: 16/8; }
					.archive-tl .tl-item:hover .tl-card { transform: none; }
				}
			`}</style>

			{/* Intro */}
			<section className="tl-intro">
				<div className="tl-eyebrow">{t('archive.eyebrow')}</div>
				<h1 className="tl-h1">{t('archive.title')}</h1>
				<p className="tl-lead">{t('archive.lead')}</p>
				<div className="tl-stats">
					<div className="tl-stat">
						<span className="n">{statEvents}</span>
						<span className="l">{t('archive.stat_events')}</span>
					</div>
					{statCities > 0 && (
						<>
							<div className="tl-stat-div" />
							<div className="tl-stat">
								<span className="n">{statCities}</span>
								<span className="l">{t('archive.stat_cities')}</span>
							</div>
						</>
					)}
					{statSpan && (
						<>
							<div className="tl-stat-div" />
							<div className="tl-stat">
								<span className="n">{statSpan}</span>
								<span className="l">{t('archive.stat_span')}</span>
							</div>
						</>
					)}
				</div>
			</section>

			{/* Timeline */}
			<section className="timeline">
				<div className="tl-now">
					<div className="tl-year" />
					<div className="tl-now-items">
						<div className="tl-now-row">
							<span className="node" />
							<span className="lbl">{t('archive.today')}</span>
						</div>
					</div>
				</div>

				{years.map((yr) => {
					const items = groups.get(yr)!;
					return (
						<div className="tl-group" key={yr}>
							<div className="tl-year">
								<div className="yn">{yr}</div>
								<div className="yc">
									{items.length === 1
										? t('events.events_count_one', { count: items.length })
										: t('events.events_count_other', { count: items.length })}
								</div>
							</div>
							<div className="tl-items">
								{items.map((ev) => {
									const recent = runningIdx++ === 0;
									const soldOut = ev.remaining_capacity === 0;
									return (
										<article
											key={ev.id}
											className={`tl-item${soldOut ? ' sold' : ''}`}
										>
											<span className="node" />
											<Link
												href={`/events/${ev.slug}`}
												onMouseEnter={() => prefetch(ev.slug)}
												onTouchStart={() => prefetch(ev.slug)}
												className="tl-card"
											>
												<div className="tl-poster">
													{ev.poster_url ? (
														<Image
															src={ev.poster_url}
															alt={`${ev.title} poster`}
															fill
															className="poster-img object-cover"
															sizes="(max-width: 760px) 100vw, 140px"
														/>
													) : (
														<div className="poster-img absolute inset-0 flex items-center justify-center p-3 text-center text-[12px] font-[800] leading-[1.08] tracking-[-0.02em] text-white">
															{ev.title}
														</div>
													)}
													{soldOut && (
														<span className="tl-stamp">
															{t('events.sold_out')}
														</span>
													)}
												</div>
												<div className="tl-body">
													<div className="tl-date">
														{formatDate(ev)}
														{recent && (
															<span className="tl-recent">
																{t('archive.most_recent')}
															</span>
														)}
													</div>
													<h3 className="tl-title">{ev.title}</h3>
													<div className="tl-meta">
														<span className="m">
															<Icon icon="mdi:map-marker-outline" width={14} />
															{ev.venue_name}
														</span>
														{ev.city && (
															<>
																<span className="tl-dot" />
																<span>{ev.city}</span>
															</>
														)}
													</div>
													<div className="tl-actions">
														<span className="tl-gal">
															{t('archive.view_details')}
															<Icon
																icon="mdi:arrow-right"
																width={13}
																className="gal-ic"
															/>
														</span>
													</div>
												</div>
											</Link>
										</article>
									);
								})}
							</div>
						</div>
					);
				})}
			</section>
		</div>
	);
}
