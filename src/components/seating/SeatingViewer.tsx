// Seating Chart Viewer — white-label storefront
// Pure Canvas 2D — zero library dependencies, instant load. Adapted from the
// besttix SuperStage viewer and re-themed to the Warm Editorial design system
// (DESIGN.md): no hardcoded hex (colors resolved from CSS custom properties at
// runtime), tier-driven seat coloring, and non-color state encoding so legibility
// never depends on the organizer's arbitrary tier colors.
//
// State encoding (DUI-3):
//   • Available  → solid tier-color fill
//   • Selected   → tier fill + brand-accent ring + check glyph
//   • Taken      → dimmed + diagonal strike (non-tappable)
//   • Unpriced   → hollow outline (non-selectable)
//
// The canvas is `aria-hidden` — it is a sighted progressive enhancement. The
// keyboard/screen-reader path is the YOUR SEATS list + "pick best seats" control
// in the sidebar (see SeatSelection / SelectedSeatsList).
'use client';

import { computeAllSeats, Section, Seat } from '@/lib/seatingGeometry';
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';

const MIN_SCALE = 0.2;
const MAX_SCALE = 5;
const HOVER_MIN_SCALE = 0.5; // don't seat-hover below this zoom
const SECTION_CLICK_SCALE = 0.85; // below this, clicking a section zooms in
const LERP = 0.18;
const MINIMAP_W = 150;
const MINIMAP_H = 100;
const MINIMAP_PAD = 12;

interface Palette {
	canvas: string;
	surface: string;
	text: string;
	muted: string;
	line: string;
	accent: string;
	onAccent: string;
}

// DESIGN.md warm-editorial defaults — used until CSS vars resolve (and as a
// hard fallback in non-DOM environments). Real values come from getComputedStyle.
const FALLBACK_PALETTE: Palette = {
	canvas: '#F3F2EF',
	surface: '#FAFAF8',
	text: '#141312',
	muted: '#7A756D',
	line: 'rgba(20,19,18,0.12)',
	accent: '#8B6914',
	onAccent: '#FAFAF8',
};

function resolvePalette(): Palette {
	if (typeof window === 'undefined') return FALLBACK_PALETTE;
	const cs = getComputedStyle(document.documentElement);
	const v = (name: string, fallback: string) => {
		const raw = cs.getPropertyValue(name).trim();
		return raw || fallback;
	};
	return {
		canvas: v('--theme-surface', FALLBACK_PALETTE.canvas),
		surface: v('--theme-bg', FALLBACK_PALETTE.surface),
		text: v('--theme-text', FALLBACK_PALETTE.text),
		muted: v('--theme-text-muted', FALLBACK_PALETTE.muted),
		line: 'rgba(20,19,18,0.12)',
		accent: v('--brand-accent', FALLBACK_PALETTE.accent),
		onAccent: v('--theme-bg', FALLBACK_PALETTE.onAccent),
	};
}

export interface SeatingViewerProps {
	sections: Section[];
	canvasW: number;
	canvasH: number;
	bookedSeatIds: Set<string>;
	selectedSeatIds: Set<string>;
	tierColorBySeatId: Map<string, string>;
	/** seatId → price (used in hover tooltip). */
	priceBySeatId?: Map<string, number>;
	currency?: string;
	onSeatToggle?: (seat: Seat) => void;
	reducedMotion?: boolean;
}

function getSeatR(sections: Section[], key: string): number {
	const s = sections.find((s) => s.key === key);
	if (!s) return 3.5;
	if (s.type === 'rect' || s.type === 'arc' || s.type === 'flat') return s.seatSize / 2;
	if (s.type === 'curved') return s.seatSize / 2;
	return 3.5;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.arcTo(x + w, y, x + w, y + r, r);
	ctx.lineTo(x + w, y + h - r);
	ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
	ctx.lineTo(x + r, y + h);
	ctx.arcTo(x, y + h, x, y + h - r, r);
	ctx.lineTo(x, y + r);
	ctx.arcTo(x, y, x + r, y, r);
	ctx.closePath();
}

export const SeatingViewer: FC<SeatingViewerProps> = ({
	sections,
	canvasW,
	canvasH,
	bookedSeatIds,
	selectedSeatIds,
	tierColorBySeatId,
	priceBySeatId,
	currency,
	onSeatToggle,
	reducedMotion = false,
}) => {
	const containerRef = useRef<HTMLDivElement>(null);
	const canvasEl = useRef<HTMLCanvasElement>(null);
	const minimapEl = useRef<HTMLCanvasElement>(null);

	// Heavy state in refs — no React re-renders for pan/zoom/hover
	const scale = useRef(1);
	const pos = useRef({ x: 0, y: 0 });
	const hovered = useRef<string | null>(null);
	const hoveredSection = useRef<string | null>(null);
	const booked = useRef(bookedSeatIds);
	const selected = useRef(selectedSeatIds);
	const tierColors = useRef(tierColorBySeatId);
	const pricesBySeat = useRef(priceBySeatId);
	const currencyRef = useRef(currency);
	const palette = useRef<Palette>(FALLBACK_PALETTE);
	const rafId = useRef<number | null>(null);
	const isPanning = useRef(false);
	const isPinching = useRef(false);
	const panStart = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
	const reducedMotionRef = useRef(reducedMotion);
	// Multi-touch tracking for pinch-to-zoom
	const activePointers = useRef(new Map<number, { x: number; y: number }>());
	const lastPinchDist = useRef<number | null>(null);
	const lastPointerType = useRef<string>('mouse');
	// Prevents first draw from using scale=1 before fit runs
	const hasInitialFit = useRef(false);

	// Lerp animation
	const targetScale = useRef(1);
	const targetPos = useRef({ x: 0, y: 0 });
	const animRafId = useRef<number | null>(null);

	const [displayScale, setDisplayScale] = useState(1);
	const [size, setSize] = useState({ w: 0, h: 0 });
	const sizeRef = useRef({ w: 0, h: 0 });
	const [tooltip, setTooltip] = useState<{ x: number; y: number; title: string; sub: string } | null>(null);
	const [cursorPointer, setCursorPointer] = useState(false);
	const [paletteReady, setPaletteReady] = useState(false);

	// Sync props into refs each render
	booked.current = bookedSeatIds;
	selected.current = selectedSeatIds;
	tierColors.current = tierColorBySeatId;
	pricesBySeat.current = priceBySeatId;
	currencyRef.current = currency;
	reducedMotionRef.current = reducedMotion;

	const allSeats = useMemo(() => computeAllSeats(sections), [sections]);

	const seatsBySection = useMemo(() => {
		const map = new Map<string, Seat[]>();
		for (const seat of allSeats) {
			if (!map.has(seat.sectionKey)) map.set(seat.sectionKey, []);
			map.get(seat.sectionKey)!.push(seat);
		}
		return map;
	}, [allSeats]);

	const sectionLabelByKey = useMemo(() => {
		const m = new Map<string, string>();
		for (const s of sections) m.set(s.key, s.label);
		return m;
	}, [sections]);

	const sectionBoundsMap = useMemo(() => {
		const map = new Map<string, { minX: number; minY: number; maxX: number; maxY: number }>();
		for (const s of sections) {
			if (s.type === 'ga') {
				map.set(s.key, { minX: s.x, minY: s.y, maxX: s.x + s.width, maxY: s.y + s.height });
				continue;
			}
			const seats = seatsBySection.get(s.key);
			if (!seats?.length) continue;
			let minX = Infinity,
				minY = Infinity,
				maxX = -Infinity,
				maxY = -Infinity;
			for (const seat of seats) {
				if (seat.x < minX) minX = seat.x;
				if (seat.y < minY) minY = seat.y;
				if (seat.x > maxX) maxX = seat.x;
				if (seat.y > maxY) maxY = seat.y;
			}
			map.set(s.key, { minX, minY, maxX, maxY });
		}
		return map;
	}, [sections, seatsBySection]);

	const sectionLabels = useMemo(() => {
		const map = new Map<string, { sx: number; sy: number; n: number }>();
		for (const s of allSeats) {
			const e = map.get(s.sectionKey) ?? { sx: 0, sy: 0, n: 0 };
			e.sx += s.x;
			e.sy += s.y;
			e.n++;
			map.set(s.sectionKey, e);
		}
		return sections
			.map((s) => {
				if (s.type === 'ga') return { key: s.key, label: s.label, x: s.x + s.width / 2, y: s.y + s.height / 2 };
				const e = map.get(s.key);
				if (!e || !e.n) return null;
				return { key: s.key, label: s.label, x: e.sx / e.n, y: e.sy / e.n };
			})
			.filter(Boolean) as { key: string; label: string; x: number; y: number }[];
	}, [sections, allSeats]);

	const isSelectable = useCallback(
		(seatId: string) => tierColors.current.has(seatId) && !booked.current.has(seatId),
		[]
	);

	// ── MINIMAP ──────────────────────────────────────────────────────────────────
	const drawMinimap = useCallback(() => {
		const mm = minimapEl.current;
		if (!mm || !canvasW || !canvasH) return;
		const mCtx = mm.getContext('2d');
		if (!mCtx) return;
		const pal = palette.current;

		const mmW = mm.width;
		const mmH = mm.height;
		const scaleX = mmW / canvasW;
		const scaleY = mmH / canvasH;

		mCtx.clearRect(0, 0, mmW, mmH);
		mCtx.fillStyle = pal.canvas;
		roundRect(mCtx, 0, 0, mmW, mmH, 7);
		mCtx.fill();
		mCtx.strokeStyle = pal.line;
		mCtx.lineWidth = 1;
		roundRect(mCtx, 0.5, 0.5, mmW - 1, mmH - 1, 7);
		mCtx.stroke();

		for (const seat of allSeats) {
			const isSel = selected.current.has(seat.id);
			const isBooked = booked.current.has(seat.id);
			const tier = tierColors.current.get(seat.id);
			if (!tier) continue; // unpriced — skip on minimap
			mCtx.fillStyle = isSel ? pal.accent : tier;
			mCtx.globalAlpha = isBooked ? 0.25 : 0.8;
			mCtx.fillRect(seat.x * scaleX - 0.9, seat.y * scaleY - 0.9, 1.8, 1.8);
		}
		mCtx.globalAlpha = 1;

		const { w, h } = sizeRef.current;
		const sc = scale.current;
		const { x: ox, y: oy } = pos.current;
		const vx = (-ox / sc) * scaleX;
		const vy = (-oy / sc) * scaleY;
		const vw = (w / sc) * scaleX;
		const vh = (h / sc) * scaleY;
		const clampedX = Math.max(0, vx);
		const clampedY = Math.max(0, vy);
		const clampedW = Math.min(mmW - clampedX, vw);
		const clampedH = Math.min(mmH - clampedY, vh);
		if (clampedW > 0 && clampedH > 0) {
			mCtx.strokeStyle = pal.accent;
			mCtx.lineWidth = 1.5;
			mCtx.strokeRect(clampedX, clampedY, clampedW, clampedH);
		}
	}, [allSeats, canvasW, canvasH]);

	// ── MAIN DRAW ────────────────────────────────────────────────────────────────
	const draw = useCallback(() => {
		const canvas = canvasEl.current;
		if (!canvas) return;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		const pal = palette.current;

		const sc = scale.current;
		const { x: ox, y: oy } = pos.current;
		const hov = hovered.current;
		const hovSec = hoveredSection.current;
		const bk = booked.current;
		const sel = selected.current;
		const tiers = tierColors.current;

		// Warm canvas background
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = pal.canvas;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		ctx.save();
		ctx.translate(ox, oy);
		ctx.scale(sc, sc);

		// GA standing zones
		for (const s of sections) {
			if (s.type !== 'ga') continue;
			ctx.globalAlpha = hovSec === s.key ? 0.18 : 0.1;
			ctx.fillStyle = pal.accent;
			roundRect(ctx, s.x, s.y, s.width, s.height, 6);
			ctx.fill();
			ctx.globalAlpha = 0.4;
			ctx.strokeStyle = pal.accent;
			ctx.lineWidth = 1 / sc;
			ctx.stroke();
			ctx.globalAlpha = 1;
			ctx.fillStyle = pal.muted;
			ctx.font = `600 ${14}px 'Instrument Sans', system-ui, sans-serif`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(s.label, s.x + s.width / 2, s.y + s.height / 2);
		}

		// Section hover glow (zoomed out)
		if (hovSec && sc < SECTION_CLICK_SCALE + 0.3) {
			const bb = sectionBoundsMap.get(hovSec);
			if (bb) {
				const pad = 10 / sc;
				const r = 8 / sc;
				ctx.globalAlpha = 0.1;
				ctx.fillStyle = pal.accent;
				roundRect(ctx, bb.minX - pad, bb.minY - pad, bb.maxX - bb.minX + pad * 2, bb.maxY - bb.minY + pad * 2, r);
				ctx.fill();
				ctx.globalAlpha = 0.35;
				ctx.strokeStyle = pal.accent;
				ctx.lineWidth = 1.5 / sc;
				ctx.stroke();
				ctx.globalAlpha = 1;
			}
		}

		// Seats — single pass
		for (const seat of allSeats) {
			const tier = tiers.get(seat.id);
			const isUnpriced = !tier;
			const isBooked = bk.has(seat.id);
			const isSelected = sel.has(seat.id);
			const isHovered = hov === seat.id;
			const r = getSeatR(sections, seat.sectionKey);

			if (isUnpriced) {
				// Hollow outline — present but not for sale
				ctx.globalAlpha = 0.5;
				ctx.strokeStyle = pal.muted;
				ctx.lineWidth = 1 / sc;
				ctx.beginPath();
				ctx.arc(seat.x, seat.y, r, 0, Math.PI * 2);
				ctx.stroke();
				ctx.globalAlpha = 1;
				continue;
			}

			if (isBooked) {
				// Dimmed fill + diagonal strike (non-color "taken" cue)
				ctx.globalAlpha = 0.32;
				ctx.fillStyle = pal.muted;
				ctx.beginPath();
				ctx.arc(seat.x, seat.y, r, 0, Math.PI * 2);
				ctx.fill();
				ctx.globalAlpha = 0.6;
				ctx.strokeStyle = pal.muted;
				ctx.lineWidth = Math.max(0.6, 1 / sc);
				const d = r * 0.7;
				ctx.beginPath();
				ctx.moveTo(seat.x - d, seat.y - d);
				ctx.lineTo(seat.x + d, seat.y + d);
				ctx.stroke();
				ctx.globalAlpha = 1;
				continue;
			}

			// Available / hovered / selected — solid tier fill
			ctx.globalAlpha = 1;
			ctx.fillStyle = tier!;
			ctx.beginPath();
			ctx.arc(seat.x, seat.y, r, 0, Math.PI * 2);
			ctx.fill();

			if (isHovered && !isSelected) {
				ctx.strokeStyle = pal.text;
				ctx.globalAlpha = 0.35;
				ctx.lineWidth = 1.5 / sc;
				ctx.beginPath();
				ctx.arc(seat.x, seat.y, r + 1.5 / sc, 0, Math.PI * 2);
				ctx.stroke();
				ctx.globalAlpha = 1;
			}

			if (isSelected) {
				// brand-accent ring (non-color cue) + check glyph when large enough
				ctx.strokeStyle = pal.accent;
				ctx.lineWidth = Math.max(1.5, 2.5 / sc);
				ctx.beginPath();
				ctx.arc(seat.x, seat.y, r + Math.max(1, 1.5 / sc), 0, Math.PI * 2);
				ctx.stroke();

				if (r * sc > 7) {
					ctx.strokeStyle = pal.onAccent;
					ctx.lineWidth = Math.max(1, r * 0.22);
					ctx.lineCap = 'round';
					ctx.lineJoin = 'round';
					ctx.beginPath();
					ctx.moveTo(seat.x - r * 0.42, seat.y + r * 0.02);
					ctx.lineTo(seat.x - r * 0.08, seat.y + r * 0.38);
					ctx.lineTo(seat.x + r * 0.46, seat.y - r * 0.34);
					ctx.stroke();
					ctx.lineCap = 'butt';
				}
			}
		}

		// Section labels (zoomed out)
		if (sc < 0.85) {
			const fs = Math.max(7, Math.min(15, 10 / sc));
			ctx.globalAlpha = 0.7;
			ctx.fillStyle = pal.text;
			ctx.font = `700 ${fs}px 'Cabinet Grotesk', 'Instrument Sans', system-ui, sans-serif`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			for (const sl of sectionLabels) ctx.fillText(sl.label, sl.x, sl.y);
		}

		ctx.globalAlpha = 1;
		ctx.restore();
	}, [allSeats, sections, sectionLabels, sectionBoundsMap]);

	const scheduleRedraw = useCallback(() => {
		if (rafId.current !== null) return;
		rafId.current = requestAnimationFrame(() => {
			rafId.current = null;
			draw();
			drawMinimap();
		});
	}, [draw, drawMinimap]);

	// ── LERP ANIMATION (respects reduced motion) ──────────────────────────────────
	const startAnimation = useCallback(
		(toScale: number, toPos: { x: number; y: number }) => {
			targetScale.current = toScale;
			targetPos.current = toPos;

			if (reducedMotionRef.current) {
				scale.current = toScale;
				pos.current = { ...toPos };
				setDisplayScale(toScale);
				draw();
				drawMinimap();
				return;
			}

			if (animRafId.current !== null) return;
			const step = () => {
				const ds = targetScale.current - scale.current;
				const dx = targetPos.current.x - pos.current.x;
				const dy = targetPos.current.y - pos.current.y;
				if (Math.abs(ds) > 0.0005 || Math.abs(dx) > 0.3 || Math.abs(dy) > 0.3) {
					scale.current += ds * LERP;
					pos.current = { x: pos.current.x + dx * LERP, y: pos.current.y + dy * LERP };
					setDisplayScale(scale.current);
					draw();
					drawMinimap();
					animRafId.current = requestAnimationFrame(step);
				} else {
					scale.current = targetScale.current;
					pos.current = { ...targetPos.current };
					setDisplayScale(targetScale.current);
					draw();
					drawMinimap();
					animRafId.current = null;
				}
			};
			animRafId.current = requestAnimationFrame(step);
		},
		[draw, drawMinimap]
	);

	const cancelAnimation = useCallback(() => {
		if (animRafId.current !== null) {
			cancelAnimationFrame(animRafId.current);
			animRafId.current = null;
		}
		targetScale.current = scale.current;
		targetPos.current = { ...pos.current };
	}, []);

	// ── EFFECTS ────────────────────────────────────────────────────────────────
	// Resolve theme tokens once mounted (CSS vars are only available client-side).
	useEffect(() => {
		palette.current = resolvePalette();
		setPaletteReady(true);
		scheduleRedraw();
	}, [scheduleRedraw]);

	// Cancel any pending frames on unmount so a late rAF can't setState on a gone component.
	useEffect(
		() => () => {
			if (rafId.current !== null) cancelAnimationFrame(rafId.current);
			if (animRafId.current !== null) cancelAnimationFrame(animRafId.current);
		},
		[]
	);

	useEffect(() => {
		scheduleRedraw();
	}, [bookedSeatIds, selectedSeatIds, tierColorBySeatId, paletteReady, scheduleRedraw]);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const ro = new ResizeObserver((entries) => {
			const { width, height } = entries[0].contentRect;
			sizeRef.current = { w: width, h: height };
			setSize({ w: width, h: height });
		});
		ro.observe(el);
		return () => ro.disconnect();
	}, []);

	useEffect(() => {
		const canvas = canvasEl.current;
		if (!canvas || !size.w) return;
		// Cap at 3 to support 3x displays (iPhone); 2 caused blurriness on high-DPR mobile
		const dpr = Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, 3);
		canvas.width = size.w * dpr;
		canvas.height = size.h * dpr;
		canvas.style.width = `${size.w}px`;
		canvas.style.height = `${size.h}px`;
		const ctx = canvas.getContext('2d');
		if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		// Fit on first resize so the very first draw uses the correct scale (not scale=1)
		if (!hasInitialFit.current && canvasW && canvasH) {
			const s = Math.min((size.w - 48) / canvasW, (size.h - 48) / canvasH, 1);
			scale.current = s;
			targetScale.current = s;
			pos.current = { x: (size.w - canvasW * s) / 2, y: (size.h - canvasH * s) / 2 };
			targetPos.current = { ...pos.current };
			setDisplayScale(s);
			hasInitialFit.current = true;
		}
		scheduleRedraw();
	}, [size, scheduleRedraw, canvasW, canvasH]);

	// Fit chart to viewport on first load
	useEffect(() => {
		if (!size.w || !size.h || !canvasW || !canvasH) return;
		const s = Math.min((size.w - 48) / canvasW, (size.h - 48) / canvasH, 1);
		scale.current = s;
		targetScale.current = s;
		pos.current = { x: (size.w - canvasW * s) / 2, y: (size.h - canvasH * s) / 2 };
		targetPos.current = { ...pos.current };
		setDisplayScale(s);
		scheduleRedraw();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [canvasW, canvasH, size.w === 0]);

	// Wheel zoom (non-passive)
	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const onWheel = (e: WheelEvent) => {
			e.preventDefault();
			cancelAnimation();
			const factor = e.deltaY > 0 ? 0.9 : 1.1;
			const rect = el.getBoundingClientRect();
			const cx = e.clientX - rect.left;
			const cy = e.clientY - rect.top;
			const prev = scale.current;
			const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * factor));
			pos.current = {
				x: cx - (cx - pos.current.x) * (next / prev),
				y: cy - (cy - pos.current.y) * (next / prev),
			};
			scale.current = next;
			targetScale.current = next;
			targetPos.current = { ...pos.current };
			setDisplayScale(next);
			scheduleRedraw();
		};
		el.addEventListener('wheel', onWheel, { passive: false });
		return () => el.removeEventListener('wheel', onWheel);
	}, [scheduleRedraw, cancelAnimation]);

	// ── POINTER (mouse + touch + pen, unified) ───────────────────────────────────
	const dragMoved = useRef(false);

	const handlePointerDown = useCallback(
		(e: React.PointerEvent) => {
			cancelAnimation();
			lastPointerType.current = e.pointerType;
			activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

			if (activePointers.current.size === 1) {
				// First finger — start pan
				isPanning.current = true;
				isPinching.current = false;
				dragMoved.current = false;
				panStart.current = { x: e.clientX, y: e.clientY, px: pos.current.x, py: pos.current.y };
			} else if (activePointers.current.size >= 2) {
				// Second finger — switch to pinch; mark dragMoved so click is suppressed
				isPanning.current = false;
				isPinching.current = true;
				dragMoved.current = true;
				const pts = [...activePointers.current.values()];
				lastPinchDist.current = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
			}
		},
		[cancelAnimation]
	);

	const handlePointerMove = useCallback(
		(e: React.PointerEvent) => {
			activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

			// Two-finger pinch-to-zoom
			if (activePointers.current.size >= 2 && lastPinchDist.current !== null) {
				const pts = [...activePointers.current.values()];
				const dist = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y);
				if (dist > 0) {
					const factor = dist / lastPinchDist.current;
					lastPinchDist.current = dist;
					const rect = containerRef.current!.getBoundingClientRect();
					const midX = (pts[0].x + pts[1].x) / 2 - rect.left;
					const midY = (pts[0].y + pts[1].y) / 2 - rect.top;
					const prev = scale.current;
					const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * factor));
					pos.current = {
						x: midX - (midX - pos.current.x) * (next / prev),
						y: midY - (midY - pos.current.y) * (next / prev),
					};
					scale.current = next;
					targetScale.current = next;
					targetPos.current = { ...pos.current };
					setDisplayScale(next);
					scheduleRedraw();
				}
				return;
			}

			// One-finger pan
			if (isPanning.current && panStart.current) {
				const ddx = e.clientX - panStart.current.x;
				const ddy = e.clientY - panStart.current.y;
				// Higher threshold for touch — finger has natural ~3px tremor
				const threshold = e.pointerType === 'touch' ? 8 : 3;
				if (Math.abs(ddx) > threshold || Math.abs(ddy) > threshold) dragMoved.current = true;
				pos.current = { x: panStart.current.px + ddx, y: panStart.current.py + ddy };
				targetPos.current = { ...pos.current };
				scheduleRedraw();
				return;
			}

			// Hover feedback — mouse/pen only (touch has no cursor)
			if (e.pointerType === 'touch') return;

			const rect = containerRef.current!.getBoundingClientRect();
			const cx = (e.clientX - rect.left - pos.current.x) / scale.current;
			const cy = (e.clientY - rect.top - pos.current.y) / scale.current;

			// Zoomed-out: section-level hover
			if (scale.current < SECTION_CLICK_SCALE + 0.3) {
				let foundSec: string | null = null;
				for (const [key, bb] of sectionBoundsMap) {
					const pad = 5;
					if (cx >= bb.minX - pad && cx <= bb.maxX + pad && cy >= bb.minY - pad && cy <= bb.maxY + pad) {
						foundSec = key;
						break;
					}
				}
				if (foundSec !== hoveredSection.current) {
					hoveredSection.current = foundSec;
					hovered.current = null;
					scheduleRedraw();
					setCursorPointer(!!foundSec);
					if (foundSec) {
						setTooltip({
							x: e.clientX - rect.left + 16,
							y: e.clientY - rect.top - 44,
							title: sectionLabelByKey.get(foundSec) ?? '',
							sub: '',
						});
					} else setTooltip(null);
				} else if (foundSec) {
					setTooltip((prev) => (prev ? { ...prev, x: e.clientX - rect.left + 16, y: e.clientY - rect.top - 44 } : prev));
				}
				return;
			}

			setCursorPointer(false);
			if (scale.current < HOVER_MIN_SCALE) {
				if (hovered.current !== null || hoveredSection.current !== null) {
					hovered.current = null;
					hoveredSection.current = null;
					setTooltip(null);
					scheduleRedraw();
				}
				return;
			}

			let found: string | null = null;
			let foundSeat: Seat | null = null;
			for (const seat of allSeats) {
				if (!isSelectable(seat.id)) continue;
				const r = getSeatR(sections, seat.sectionKey);
				if (Math.abs(seat.x - cx) > r + 1 || Math.abs(seat.y - cy) > r + 1) continue;
				const dx = seat.x - cx,
					dy = seat.y - cy;
				if (dx * dx + dy * dy <= (r + 1) * (r + 1)) {
					found = seat.id;
					foundSeat = seat;
					break;
				}
			}

			if (found !== hovered.current) {
				hovered.current = found;
				setCursorPointer(!!found);
				scheduleRedraw();
				if (foundSeat) {
					const price = pricesBySeat.current?.get(foundSeat.id);
					const priceStr = price != null ? ` · ${price} ${currencyRef.current ?? ''}` : '';
					setTooltip({
						x: e.clientX - rect.left + 16,
						y: e.clientY - rect.top - 60,
						title: sectionLabelByKey.get(foundSeat.sectionKey) ?? '',
						sub: `Rând ${foundSeat.row} · Loc ${foundSeat.num}${priceStr}`,
					});
				} else setTooltip(null);
			}
		},
		[allSeats, sections, sectionBoundsMap, sectionLabelByKey, isSelectable, scheduleRedraw]
	);

	const endPan = useCallback((e: React.PointerEvent) => {
		activePointers.current.delete(e.pointerId);

		if (activePointers.current.size === 0) {
			// All fingers lifted
			isPanning.current = false;
			isPinching.current = false;
			lastPinchDist.current = null;
			panStart.current = null;
		} else if (activePointers.current.size === 1) {
			// One finger remains after pinch — resume single-finger pan
			isPinching.current = false;
			lastPinchDist.current = null;
			const [rem] = activePointers.current.values();
			panStart.current = { x: rem.x, y: rem.y, px: pos.current.x, py: pos.current.y };
			isPanning.current = true;
		}
	}, []);

	const handleMouseLeave = useCallback((e: React.PointerEvent) => {
		activePointers.current.delete(e.pointerId);
		if (activePointers.current.size === 0) {
			isPanning.current = false;
			isPinching.current = false;
			lastPinchDist.current = null;
			panStart.current = null;
			hovered.current = null;
			hoveredSection.current = null;
			setTooltip(null);
			setCursorPointer(false);
			scheduleRedraw();
		}
	}, [scheduleRedraw]);

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			if (dragMoved.current) {
				dragMoved.current = false;
				return; // pan gesture, not a tap
			}
			const rect = containerRef.current!.getBoundingClientRect();
			const cx = (e.clientX - rect.left - pos.current.x) / scale.current;
			const cy = (e.clientY - rect.top - pos.current.y) / scale.current;

			// Zoomed out: tap/click section → zoom in
			// On touch, hoveredSection is never set (no mousemove), so we resolve from coords
			if (scale.current <= SECTION_CLICK_SCALE + 0.3) {
				let tappedSection = hoveredSection.current;
				if (!tappedSection) {
					for (const [key, bb] of sectionBoundsMap) {
						const pad = 12 / scale.current;
						if (cx >= bb.minX - pad && cx <= bb.maxX + pad && cy >= bb.minY - pad && cy <= bb.maxY + pad) {
							tappedSection = key;
							break;
						}
					}
				}
				if (tappedSection) {
					const bb = sectionBoundsMap.get(tappedSection);
					if (bb) {
						const { w, h } = sizeRef.current;
						const padding = 60;
						const sW = bb.maxX - bb.minX + padding * 2;
						const sH = bb.maxY - bb.minY + padding * 2;
						const newScale = Math.min(MAX_SCALE, Math.min(w / sW, h / sH) * 0.9);
						const centerX = (bb.minX + bb.maxX) / 2;
						const centerY = (bb.minY + bb.maxY) / 2;
						startAnimation(newScale, { x: w / 2 - centerX * newScale, y: h / 2 - centerY * newScale });
						setTooltip(null);
						return;
					}
				}
			}

			if (scale.current < HOVER_MIN_SCALE || !onSeatToggle) return;

			// Touch-friendly hit radius: minimum 44px touch target (22px radius in screen px → canvas units)
			const isTouch = lastPointerType.current === 'touch';
			const MIN_TOUCH_R = 22 / scale.current;

			// Find the CLOSEST seat within hit radius (not just the first)
			let bestSeat: Seat | null = null;
			let bestDist = Infinity;
			for (const seat of allSeats) {
				if (!isSelectable(seat.id)) continue;
				const r = getSeatR(sections, seat.sectionKey);
				const hitR = isTouch ? Math.max(r, MIN_TOUCH_R) : r;
				const dx = seat.x - cx, dy = seat.y - cy;
				const d2 = dx * dx + dy * dy;
				if (d2 <= hitR * hitR && d2 < bestDist) {
					bestDist = d2;
					bestSeat = seat;
				}
			}
			if (bestSeat) onSeatToggle(bestSeat);
		},
		[allSeats, sections, onSeatToggle, sectionBoundsMap, startAnimation, isSelectable]
	);

	const handleZoom = useCallback(
		(factor: number) => {
			const { w, h } = sizeRef.current;
			const cx = w / 2,
				cy = h / 2;
			const prev = scale.current;
			const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev * factor));
			startAnimation(next, { x: cx - (cx - pos.current.x) * (next / prev), y: cy - (cy - pos.current.y) * (next / prev) });
		},
		[startAnimation]
	);

	const handleReset = useCallback(() => {
		const { w, h } = sizeRef.current;
		if (!w || !canvasW || !canvasH) return;
		const s = Math.min((w - 48) / canvasW, (h - 48) / canvasH, 1);
		startAnimation(s, { x: (w - canvasW * s) / 2, y: (h - canvasH * s) / 2 });
	}, [canvasW, canvasH, startAnimation]);

	const zoomBtn =
		'flex h-11 w-11 items-center justify-center rounded-[10px] border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] bg-[var(--theme-bg)]/90 text-[1.25rem] leading-none text-[var(--theme-text)] backdrop-blur transition-colors hover:bg-[var(--theme-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-accent)]';

	return (
		<div
			ref={containerRef}
			className="relative h-full w-full select-none overflow-hidden rounded-[20px] border border-[color-mix(in_srgb,var(--theme-text)_8%,transparent)] bg-[var(--theme-surface)]"
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={endPan}
			onPointerLeave={handleMouseLeave}
			onPointerCancel={endPan}
			style={{ cursor: isPanning.current ? 'grabbing' : cursorPointer ? 'pointer' : 'grab', touchAction: 'none' }}
		>
			<canvas
				ref={canvasEl}
				className="absolute inset-0 block"
				aria-hidden="true"
				onClick={handleClick}
				onContextMenu={(e) => e.preventDefault()}
			/>

			{/* Minimap — decorative, hidden from assistive tech */}
			<canvas
				ref={minimapEl}
				width={MINIMAP_W}
				height={MINIMAP_H}
				aria-hidden="true"
				className="pointer-events-none absolute hidden rounded-[10px] sm:block"
				style={{ bottom: MINIMAP_PAD, right: MINIMAP_PAD, opacity: 0.95 }}
			/>

			{/* Tooltip */}
			{tooltip && (
				<div
					className="pointer-events-none absolute z-20 whitespace-nowrap rounded-[10px] border border-[color-mix(in_srgb,var(--theme-text)_10%,transparent)] bg-[var(--theme-bg)]/95 px-3 py-1.5 shadow-[0_2px_12px_rgba(20,19,18,0.1)] backdrop-blur"
					style={{ left: tooltip.x, top: tooltip.y }}
				>
					<div className="font-[family-name:var(--font-display)] text-[0.8125rem] font-[700] text-[var(--theme-text)]">
						{tooltip.title}
					</div>
					{tooltip.sub && (
						<div className="font-[family-name:var(--font-data)] text-[0.75rem] tabular-nums text-[var(--theme-text-muted)]">
							{tooltip.sub}
						</div>
					)}
				</div>
			)}

			{/* Zoom controls — bottom-left, 44px targets */}
			<div className="absolute bottom-3 left-3 z-10 flex flex-col gap-1.5">
				<button type="button" className={zoomBtn} onClick={() => handleZoom(1.3)} aria-label="Zoom in" tabIndex={-1}>
					+
				</button>
				<button type="button" className={zoomBtn} onClick={() => handleZoom(1 / 1.3)} aria-label="Zoom out" tabIndex={-1}>
					−
				</button>
				<button
					type="button"
					className={`${zoomBtn} text-[0.75rem]`}
					onClick={handleReset}
					aria-label="Reset view"
					tabIndex={-1}
				>
					⤢
				</button>
			</div>

			{/* Zoom % */}
			<div className="absolute left-3 top-3 z-10 font-[family-name:var(--font-data)] text-[0.6875rem] tabular-nums text-[var(--theme-text-muted)]">
				{Math.round(displayScale * 100)}%
			</div>
		</div>
	);
};

export default SeatingViewer;
