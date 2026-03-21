# Design System — TixLive White-Label Platform

## Product Context
- **What this is:** White-label public ticketing sites deployed per event organizer
- **Who it's for:** Attendees buying tickets from organizer-branded sites
- **Space/industry:** Live event ticketing (concerts, conferences, sports)
- **Project type:** Consumer web app (event discovery + checkout)
- **Comparable products:** DICE, Eventbrite, Afisha.ru, Yandex Afisha

## Aesthetic Direction
- **Direction:** Industrial/Utilitarian with event-type personality
- **Decoration level:** Minimal — the event poster IS the decoration
- **Mood:** Confident, direct, trust-building. The organizer's brand dominates, not TixLive's. Each event type gets a distinct visual personality (dark/electric for concerts, professional/clean for conferences, bold/energetic for sports) while sharing the same component library.
- **Reference sites:** Afisha.ru (editorial hierarchy, featured event hero), DICE (trust-first, dark themes), Yandex Afisha (clean data layout)

## Typography

Four fonts, each with a clear purpose. No decorative fonts. No overused fonts (Inter, Roboto, Poppins).

| Role | Font | Weights | Rationale |
|------|------|---------|-----------|
| Display/Hero | Satoshi | 400, 500, 700, 900 | Geometric with personality — confident without flashy. Distinct from template fonts. |
| Body/Labels | DM Sans | 400, 500, 600 | Humanist sans-serif, excellent readability at small sizes. |
| Data/Prices | Geist | 400, 500, 700 | Crisp numbers, supports `tabular-nums`. Used for prices, capacity badges, metrics. |
| Code/Mono | Geist Mono | 400 | Timestamps, ticket IDs, order references. |

**Loading:**
- Satoshi: Fontshare CDN — `https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap`
- DM Sans, Geist, Geist Mono: Google Fonts via `next/font`

**Why Satoshi over Inter:** Inter is the default AI/template font. Every competitor site built with AI tools uses Inter or Roboto. Satoshi gives the platform a curated feel that signals "designed by humans, not generated." This is a deliberate creative risk — it breaks from convention to be memorable.

**CSS Custom Properties:**
```css
--font-display: 'Satoshi', 'DM Sans', system-ui, sans-serif;
--font-body: 'DM Sans', system-ui, sans-serif;
--font-data: 'Geist', system-ui, sans-serif;
--font-mono: 'Geist Mono', ui-monospace, monospace;
```

**Important:** These are defined with hardcoded font names in `:root`, NOT via `var(--font-dm-sans)` references. Next.js `next/font` variables are scoped to `<main>` class names, not `:root`. Using `var()` references in `:root` resolves to empty strings.

**Type Scale:**
| Level | Size | Font | Weight | Tracking | Usage |
|-------|------|------|--------|----------|-------|
| display | 2.25rem (36px) | Satoshi | 900 | -1.5px | Event titles, hero headline |
| h1 | 1.875rem (30px) | Satoshi | 700 | -0.5px | Organizer name |
| h2 | 1.5rem (24px) | Satoshi | 700 | -0.3px | Section headers ("All Events") |
| h3 | 1.125rem (18px) | Satoshi | 600 | — | Ticket type names, checkout headings |
| body | 0.9375rem (15px) | DM Sans | 400 | — | Descriptions, form labels |
| caption | 0.75rem (12px) | Geist | 500 | 1.5px (uppercase) | Date, venue, price chips |

**Usage in code:** `font-[family-name:var(--font-display)]` for Tailwind classes.

**Blacklist:** Never use Papyrus, Comic Sans, Lobster, Impact, Jokerman, Courier New (for body), or any decorative script fonts.

## Color

- **Approach:** Theme-based — colors are injected via CSS custom properties per event type. Components never hardcode hex colors.

### Default Tokens (light, used for organizer landing)
```css
--brand-primary: #6366f1;    /* Indigo — TixLive brand default */
--brand-accent: #8b5cf6;     /* Violet — secondary actions, gradients */
--theme-bg: #ffffff;
--theme-surface: #f9fafb;    /* Cards, elevated surfaces */
--theme-text: #111827;
--theme-text-muted: #6b7280;
```

### Concert Theme (dark, electric)
```css
--brand-primary: #8b5cf6;    /* Purple — electric, nightlife */
--brand-accent: #ec4899;     /* Pink — energy, excitement */
--theme-bg: #0a0a0a;         /* Near-black */
--theme-surface: #1a1a1a;    /* Dark gray — elevation */
--theme-text: #f9fafb;       /* Off-white (not pure white) */
--theme-text-muted: #9ca3af;
```

### Conference Theme (professional, trust)
```css
--brand-primary: #1d4ed8;    /* Blue — trust, authority */
--brand-accent: #0891b2;     /* Teal — innovation */
--theme-bg: #ffffff;
--theme-surface: #f8fafc;
--theme-text: #0f172a;       /* Slate-900 */
--theme-text-muted: #64748b;
```

### Sports Theme (high energy, bold)
```css
--brand-primary: #ef4444;    /* Red — competition, energy */
--brand-accent: #f97316;     /* Orange — excitement */
--theme-bg: #0f172a;         /* Dark navy */
--theme-surface: #1e293b;    /* Slate-800 */
--theme-text: #f8fafc;
--theme-text-muted: #94a3b8;
```

### Semantic Colors (consistent across all themes)
| Purpose | Hex | Usage |
|---------|-----|-------|
| Success | #10B981 | Checkout success, promo applied |
| Warning | #F59E0B | Low capacity badges ("14 left") |
| Error | #EF4444 | Critical capacity, form errors, "Sold Out" |
| Info | #3B82F6 | Magic-link confirmation, informational banners |

### Color Rules
1. **Never hardcode hex colors in components.** Use `var(--brand-primary)`, `var(--theme-text)`, etc.
2. **For adaptive opacity:** Use `color-mix(in srgb, var(--theme-text) 15%, transparent)` — NOT `bg-white/15` or Tailwind opacity modifiers with hardcoded colors.
3. **Dark theme text:** Use `--theme-text` (off-white), never pure `#ffffff`.
4. **Elevation in dark themes:** Surfaces get lighter (`--theme-surface` > `--theme-bg`), not darker. Shadows are invisible on dark backgrounds — use border contrast instead: `border-[color-mix(in_srgb,var(--theme-text)_15%,transparent)]`.
5. **Contrast ratios:** All text on `--theme-bg`: min 4.5:1 (body), min 3:1 (large text 18px+).

### Organizer Brand Override
Organizers can set custom `brand_primary` and `brand_accent` colors in the besttix admin. These override the event-type defaults at request time via `getServerSideProps`. Components should never assume a specific primary color.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(16px) lg(24px) xl(32px) 2xl(48px) 3xl(64px)

## Layout
- **Approach:** Grid-disciplined
- **Grid:** 2 cols mobile, 3 sm, 4 lg, 5 xl (event grid)
- **Max content width:** `max-w-6xl` (1152px)
- **Two-column pages:** Event detail and checkout use `md:flex md:gap-8` with `flex-1` left + `w-[340px]` sticky right sidebar

### Border Radius (hierarchical)
| Element | Radius | Token |
|---------|--------|-------|
| Event cards | 12px | `rounded-xl` |
| Primary CTAs | 9999px | `rounded-full` (pill) |
| Secondary buttons | 8px | `rounded-lg` |
| Inputs | 12px | `rounded-xl` |
| Badges/chips | 9999px | `rounded-full` |
| Sidebar cards | 16px | `rounded-2xl` |

### Shadows
- Event cards: **NO shadow** — poster fills card edge-to-edge, lift via `translateY`
- Form/checkout cards: `shadow-sm` (functional separation)
- Sticky bottom CTA: `shadow-[0_-4px_20px_rgba(0,0,0,0.12)]` (upward shadow)
- Dark theme sidebar: No shadow-lg (invisible on dark bg). Use border contrast instead.

## Motion
- **Approach:** Minimal-functional
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms)
- **Urgency pulse:** `animation: urgency-pulse 1.5s ease-in-out infinite` (critical capacity badge only)
- **`prefers-reduced-motion`:** All animations disabled. Global `*` rule zeroes durations.
- **Never animate:** `width`, `height`, `top`, `left` — only `transform` and `opacity`
- **Never use:** `transition: all` — always list specific properties

## Component Vocabulary

Built on HeroUI (`@heroui/react`). Never use raw HTML `<button>` or `<input>`.

| Component | HeroUI | Variant | Notes |
|-----------|--------|---------|-------|
| Primary CTA | `<Button>` | `variant="solid"` | Pill shape, brand-primary bg, white text |
| Secondary CTA | `<Button>` | `variant="ghost"` | Outlined, brand-primary text |
| Text input | `<Input>` | — | `rounded-xl`, theme-aware borders |
| Chips/filters | `<Chip>` | `bordered` / `solid` | Active=solid brand-primary, inactive=bordered theme-text |
| Tabs | `<Tab>` | — | Session picker uses tab semantics |

### Custom Components
- `CapacityBadge` — 4-tier: Available (>20, hidden), Low (<=20, amber), Critical (<=5, red + pulse), Sold Out (0, red + strikethrough)
- `SessionPicker` — Horizontal scrollable date tabs with proper ARIA tablist/tab roles
- `StickyBuyBar` — Mobile-only bottom bar with price + CTA, `env(safe-area-inset-bottom)`
- `ShareButton` — Two variants: `hero` (white on dark) and `inline` (theme-muted)

## Accessibility

- **Touch targets:** Minimum 44x44px on all interactive elements
- **Focus:** `focus-visible` ring, never `outline: none` without replacement
- **Keyboard:** All interactions reachable via keyboard
- **Screen readers:** Proper ARIA labels on buttons, form groups with `role="group"`, tab panels
- **Color:** Never color-only encoding — always pair with labels or icons
- **Viewport:** Never `user-scalable=no` or `maximum-scale=1`

## Anti-Patterns (AI Slop Blacklist)

Never include in any page or component:
- Purple/violet gradient backgrounds as decoration
- 3-column feature grid with icons in colored circles
- `text-align: center` on all headings and descriptions
- Uniform bubbly border-radius on every element
- Decorative blobs, floating circles, wavy SVG dividers
- Emoji as design elements in headings
- Colored left-border on cards (`border-left: 3px solid`)
- Generic hero copy ("Welcome to X", "Unlock the power of", "Your all-in-one solution")
- Cookie-cutter section rhythm (hero → 3 features → testimonials → pricing → CTA)

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-19 | Satoshi over Inter for display | Avoids template-font association; competitors use distinctive type |
| 2026-03-19 | Event-type CSS themes | Different event categories need different visual moods |
| 2026-03-19 | No carousel — FeaturedHero | Static hero is more intentional than auto-advancing carousel (Afisha.ru pattern) |
| 2026-03-19 | Two-column event + checkout | Sidebar keeps CTA visible while scrolling content (tix-live pattern) |
| 2026-03-21 | Hardcoded font names in :root | Next.js font CSS vars are scoped to `<main>`, not `:root` |
| 2026-03-21 | `color-mix()` for adaptive opacity | Theme-safe alternative to hardcoded `bg-white/X` |
| 2026-03-21 | Border contrast over shadow in dark themes | `shadow-lg` is invisible on dark backgrounds |
| 2026-03-21 | Design system documented | Created by /design-consultation from verified implementation |
