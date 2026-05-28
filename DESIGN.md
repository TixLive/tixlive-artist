# Design System — TixLive White-Label Platform

## Product Context
- **What this is:** White-label public ticketing sites deployed per event organizer
- **Who it's for:** Attendees buying tickets from organizer-branded sites
- **Space/industry:** Live event ticketing (concerts, conferences, sports)
- **Project type:** Consumer web app (event discovery + checkout)
- **Comparable products:** DICE, Eventbrite, Songkick, Apple, Linear

## Aesthetic Direction
- **Direction:** Premium B&W — Apple-style
- **Decoration level:** Minimal — typography, whitespace, and the event poster do all the work
- **Mood:** Quiet, premium, editorial. Pure-white canvas, sharp near-black ink, soft shadows instead of heavy borders. The platform recedes; the artwork and price are loud.
- **Reference sites:** Apple (typography, whitespace, glass blur), Linear (restraint), DICE (poster-forward)

## Typography

Two fonts, one purpose each. No "designer" fonts, no AI defaults.

| Role | Font | Weights | Rationale |
|------|------|---------|-----------|
| Display + Body | Manrope | 400, 500, 600, 700, 800 | Geometric humanist sans-serif. Tight tracking at 800 reads as poster-headline; at 500 reads as clean body. One family covers the whole stack, simplifying the cascade. |
| Code/Mono | JetBrains Mono | 400, 500 | Ticket IDs, order references, accent eyebrows that need monospaced rhythm. |

**Inter Tight** is listed as a hardcoded fallback in CSS only — it never actually loads. Manrope renders identically across our weight range.

**Loading:** Both via `next/font/google` in `src/styles/font.ts`. The CSS variables `--font-manrope` and `--font-jetbrains-mono` are attached on the root `<div>` in `_app.tsx`.

**Why Manrope:** Premium, modern, distinct from Inter/DM Sans/Poppins. Excellent Latin Extended + Cyrillic for our `ro`/`ru` locales. At weight 800 with -0.04em tracking it has poster energy; at 500 with -0.01em it disappears into body copy. One family, full range.

**Why JetBrains Mono:** Crisp tabular numerals for ticket IDs and prices, distinct from generic SF Mono/Roboto Mono.

**CSS Custom Properties (in `:root`):**
```css
--font-display: 'Manrope', 'Inter Tight', system-ui, sans-serif;
--font-body:    'Manrope', 'Inter Tight', system-ui, sans-serif;
--font-data:    'Manrope', 'Inter Tight', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', ui-monospace, monospace;
```

**Important:** Tokens are hardcoded font names in `:root`, NOT `var(--font-manrope)` references. Next.js font-family variables are scoped to the descendant of the className they're attached to, not `:root`.

**Type Scale:**
| Level | Size | Weight | Tracking | Line-Height | Usage |
|-------|------|--------|----------|-------------|-------|
| h1 / display | clamp(40px, 5.4vw, 64px) | 800 | -0.04em | 1.0 | Event titles, landing hero |
| h2 | clamp(28px, 3vw, 40px) | 800 | -0.032em | 1.06 | Section headers |
| h3 | 21px | 700 | -0.022em | 1.2 | Card titles, ticket type names |
| h4 | 15px | 700 | -0.014em | 1.25 | Inline labels, sidebar headings |
| body | 15px | 500 | -0.01em | 1.55 | Descriptions, form labels |
| micro | 13px | 500 | — | 1.45 | Captions, secondary info |
| eyebrow | 11px | 700 | 0.08em (uppercase) | — | Category tags, section eyebrows |

**Usage in code:** `font-[family-name:var(--font-display)]` is allowed, but since `--font-display` and `--font-body` are both Manrope, you generally don't need to set font-family at all — the cascade does the work.

**Blacklist:** Never use Papyrus, Comic Sans, Lobster, Impact, Inter, Roboto, Poppins, DM Sans, or any decorative script fonts.

## Color

- **Approach:** Premium B&W. Color is almost absent. The contrast between near-black ink (#0A0A0A) and pure-white canvas (#FFFFFF) does the dramatic work; accents appear only on the CTA and the brand identity.

### Tokens (canonical)
```css
/* Canvas */
--bg:           #FFFFFF;  /* Page canvas */
--bg-2:         #F5F5F7;  /* Hover surfaces, filter chips, soft pill backgrounds */
--bg-3:         #EBEBEF;  /* Active surfaces, deeper pill hover */
--surface:      #FFFFFF;  /* Cards, modals */
--surface-elev: #FAFAFC;  /* Slightly elevated surfaces */

/* Ink scale */
--ink:    #0A0A0A;  /* Primary text, primary CTA */
--ink-2:  #1D1D1F;  /* CTA hover, slightly softer headings */
--ink-3:  #6E6E73;  /* Secondary text, footer */
--ink-4:  #98989F;  /* Placeholder text, tertiary */
--ink-5:  #C7C7CC;  /* Hairline dividers in dark contexts */

/* Hairlines */
--line:   #E8E8ED;  /* Default border */
--line-2: #F0F0F2;  /* Soft inner divider */

/* Accent */
--accent:        #0A0A0A;  /* Default = ink. Organizer brand_accent overrides. */
--accent-fg:     #FFFFFF;  /* Foreground on --accent */
--accent-hover:  #1D1D1F;
```

### Legacy aliases (preserved, do not extend)
`--brand-primary`, `--brand-accent`, `--theme-bg`, `--theme-surface`, `--theme-text`, `--theme-text-muted` are kept as aliases of the canonical tokens above so the older components render correctly without per-file edits. **New components should always use the canonical `--ink/--bg/--line/--accent` tokens.**

### Semantic Colors (consistent across the system)
| Purpose | Hex | Usage |
|---------|-----|-------|
| Success | #16A34A | Checkout success, promo applied, live-pulse dot |
| Warning | #D97706 | Low capacity badges ("14 left") |
| Error | #DC2626 | Critical capacity, form errors, "Sold Out" |
| Info | #2563EB | Magic-link confirmation, informational banners |

### Color Rules
1. **Never hardcode hex colors in components.** Use `var(--ink)`, `var(--bg)`, `var(--line)`, `var(--accent)`, etc.
2. **For adaptive opacity:** Use `color-mix(in srgb, var(--ink) 8%, transparent)` — NOT Tailwind `text-black/8`.
3. **Pure-white canvas is non-negotiable.** Cards float on `--bg` (#FFFFFF). Surfaces lift via shadow, never via heavy borders.
4. **Hairlines, not borders.** Default separation is `1px solid var(--line)` (#E8E8ED). Never use thick borders.
5. **No event-type theming.** All event types share the same B&W system. Only the organizer's accent color may differ (see below).
6. **Contrast:** Body text on `--bg` ≥ 4.5:1. `--ink-3` (#6E6E73) passes on `--bg` for 14px+ text.

### Organizer Brand Override
Organizers can set `brand_primary` and `brand_accent` in the besttix admin. `BrandInjector` in `_app.tsx` overrides `--brand-primary` and `--brand-accent` (the legacy aliases) at request time. **For the new design, prefer mapping organizer-supplied colors onto `--accent` and `--ink` directly in BrandInjector if/when we need per-organizer color identity.**

## Spacing & Radius
- **Base unit:** 4px
- **Density:** Generous whitespace — 56px+ gutters between hero/sidebar; 28-32px between sections on mobile
- **Scale:** 4 / 8 / 12 / 16 / 20 / 24 / 28 / 32 / 48 / 56 / 80

### Border Radius (hierarchical)
| Element | Token | Value |
|---------|-------|-------|
| Cards | `--r-card` | 18px |
| Large cards (hero, posters) | `--r-card-lg` | 28px |
| Buttons | `--r-pill` | 9999px (full pill) |
| Inputs | `--r-input` | 14px |
| Inline chips/badges | `--r-pill` | 9999px |

**Pill buttons are the system default.** Apple-style. Secondary surfaces (filter chips, language switcher, account button) also pill. Inputs stay at 14px so they read as form elements, not pills.

### Shadows
```css
--shadow-1:      0 1px 2px rgba(0,0,0,0.04);                                              /* default card */
--shadow-2:      0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06);                  /* hovered card */
--shadow-float:  0 10px 30px -8px rgba(0,0,0,0.12), 0 4px 12px -4px rgba(0,0,0,0.08);     /* dropdowns, modals */
--shadow-hover:  0 12px 36px -8px rgba(0,0,0,0.15), 0 4px 12px -4px rgba(0,0,0,0.08);     /* card lift */
--shadow-cinema: 0 40px 80px -20px rgba(0,0,0,0.30), 0 20px 40px -12px rgba(0,0,0,0.18);  /* hero poster */
```

Cards mostly use `--shadow-1` with a `1px solid var(--line)` border. Lift comes from `translateY(-2px)` + `--shadow-hover`, never from changing the border.

## Layout
- **Grid:** 2 cols mobile, 3 sm, 4 lg, 5 xl (event grid)
- **Max content width:** `1200px` shell (was 1152px in the old system)
- **Two-column pages:** Event detail / checkout use `grid-template-columns: 1fr 380px` with 56px gap and a static-on-mobile sidebar
- **Header height:** 72px (was 64px)

## Motion
- **Approach:** Minimal-functional with one indulgence — the urgency CTA breath + shimmer
- **Easing:** `cubic-bezier(.2, .7, .2, 1)` for everything that's not standard ease
- **Duration:** micro (80–150ms) / short (220–350ms) / page-in (350ms)
- **Press feedback:** `transform: scale(0.97-0.98)` on `:active` for 80ms
- **Page mount:** 350ms fade + 8px translateY rise
- **Urgency CTA:** `urgency-breath` 3.2s + `urgency-shimmer` 3.8s (paused on hover/focus)
- **`prefers-reduced-motion`:** All animations disabled (see `globals.css`)
- **Never animate:** `width`, `height`, `top`, `left` — only `transform` and `opacity`
- **Never use:** `transition: all` — always list specific properties

## Component Vocabulary

Built on HeroUI (`@heroui/react`) with the theme override in `src/styles/hero.ts`. HeroUI's `primary` color maps to `--ink`; default radii lifted to 10/14/18px.

| Component | HeroUI | Variant | Notes |
|-----------|--------|---------|-------|
| Primary CTA | `<Button color="primary">` | `solid` | Pill, near-black bg (#0A0A0A), white text, scale-press feedback |
| Secondary CTA | `<Button>` | `bordered` / `light` | Pill, ink-on-white with `--line` border, hover fill `--bg-2` |
| Text input | `<Input>` | — | `radius="md"` (14px), `--line` border, focus ring on `--ink` |
| Chip/filter | `<Chip>` | `bordered` (inactive), `solid` (active) | Inactive `--ink-3` outline; active `--ink` bg + white text |
| Tabs | `<Tab>` | — | Underline style, `--ink` for active |

### Custom Components
- `CapacityBadge` — Available (>20, hidden), Low (≤20, amber), Critical (≤5, red + pulse), Sold Out (0, red + strikethrough)
- `SessionPicker` — Horizontal pill date tabs with ARIA tablist/tab
- `StickyBuyBar` (event/listing) — Fixed bottom black bar with white CTA pill, `env(safe-area-inset-bottom)`
- `ShareButton` — Pill, ink-on-bg-2

## Accessibility
- **Touch targets:** 44×44px minimum
- **Focus:** `focus-visible` outline 2px `var(--ink)` with 3px offset
- **Keyboard:** All interactions reachable
- **ARIA:** Tablists, comboboxes, dialogs labeled
- **Viewport:** Never `user-scalable=no` or `maximum-scale=1`

## Anti-Patterns (AI Slop Blacklist)
Never include:
- Purple / violet gradient backgrounds, glowy halos
- 3-column feature grid with icons in colored circles
- Center-aligned headings and paragraphs everywhere
- Decorative blobs, floating circles, wavy SVG dividers
- Emoji in headings or buttons
- Colored left-border accent on cards
- Generic copy ("Welcome to X", "Unlock the power of...")
- Cookie-cutter section rhythm (hero → 3 features → testimonials → pricing → CTA)
- Heavy borders (>1px) used for separation — use `--shadow-1` + hairline instead
- Per-event-type accent overrides (concert=violet, sports=red, etc.) — **removed in 2026-05-28 redesign**

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-04 | Warm Editorial Gallery direction (Cabinet Grotesk + #FAFAF8 + #8B6914 gold) | Differentiated from sterile-white competitors |
| 2026-05-28 | **Replaced** Warm Editorial with Premium B&W (Manrope + pure white + near-black) | User-led full redesign. Apple-style restraint reads more premium for high-ticket events; one font family simplifies cascade; pure-white canvas pairs cleanly with poster artwork |
| 2026-05-28 | Dropped multi-event-type theming (`[data-event-type]` selectors) | New system has a single accent. Per-event-type color was visual noise without information value. Organizer-supplied `brand_accent` still overrides for white-label identity |
| 2026-05-28 | Pill buttons (`--r-pill`) became default | Apple-style; secondary surfaces (language switch, account, filter chips) all pill for consistency |
| 2026-05-28 | Hairlines (`--line` = #E8E8ED) replace 8–12% opacity borders | Cleaner against pure-white canvas; pairs with `--shadow-1` for soft elevation |
| 2026-05-28 | Header height 64→72px | Matches the new design's breathing-room spacing; `BuyFlowSteps` sticky offset updated accordingly |
