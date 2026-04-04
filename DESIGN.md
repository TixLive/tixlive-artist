# Design System — TixLive White-Label Platform

## Product Context
- **What this is:** White-label public ticketing sites deployed per event organizer
- **Who it's for:** Attendees buying tickets from organizer-branded sites
- **Space/industry:** Live event ticketing (concerts, conferences, sports)
- **Project type:** Consumer web app (event discovery + checkout)
- **Comparable products:** DICE, Eventbrite, Songkick, Ticketmaster

## Aesthetic Direction
- **Direction:** Warm Editorial Gallery
- **Decoration level:** Minimal — the event poster IS the decoration
- **Mood:** Quiet confidence. A well-lit gallery where posters are hung on warm linen walls. The platform recedes, the artwork speaks. Typography and whitespace do the heavy lifting.
- **Reference sites:** DICE (authenticity, custom type), Eventbrite (clean layout), Songkick (music-forward)

## Typography

Four fonts, each with a clear purpose. No overused fonts (Inter, Roboto, Poppins).

| Role | Font | Weights | Rationale |
|------|------|---------|-----------|
| Display/Hero | Cabinet Grotesk | 700, 800, 900 | Cinematic, poster-like. Tight tracking creates dense, impactful headlines. |
| Body/Labels | Instrument Sans | 400, 500, 600 | Clean humanist sans-serif. Modern without being generic. Excellent readability. |
| Data/Prices | Geist | 400, 500, 700 | Crisp numbers, supports `tabular-nums`. Used for prices, capacity, metrics. |
| Code/Mono | Geist Mono | 400 | Timestamps, ticket IDs, order references. |

**Loading:**
- Cabinet Grotesk: Fontshare CDN — `https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700,800,900&display=swap`
- Instrument Sans: Fontshare CDN — `https://api.fontshare.com/v2/css?f[]=instrument-sans@400,500,600&display=swap`
- Geist, Geist Mono: Google Fonts via `next/font`

**Why Cabinet Grotesk:** Bold, geometric, cinematic. At weight 900 with tight tracking it creates poster-energy headlines that feel intentional and curated. No ticketing competitor uses it.

**Why Instrument Sans:** Clean and modern without being the default AI font. Better character than Inter/DM Sans, excellent Latin Extended support for Romanian/Russian content.

**CSS Custom Properties:**
```css
--font-display: 'Cabinet Grotesk', 'Instrument Sans', system-ui, sans-serif;
--font-body: 'Instrument Sans', system-ui, sans-serif;
--font-data: 'Geist', system-ui, sans-serif;
--font-mono: 'Geist Mono', ui-monospace, monospace;
```

**Important:** These are defined with hardcoded font names in `:root`, NOT via `var(--font-x)` references. Next.js `next/font` variables are scoped to `<main>` class names, not `:root`.

**Type Scale:**
| Level | Size | Font | Weight | Tracking | Usage |
|-------|------|------|--------|----------|-------|
| display | 2.5rem (40px) | Cabinet Grotesk | 900 | -2px | Event titles, hero headline |
| h1 | 2rem (32px) | Cabinet Grotesk | 800 | -1px | Organizer name, page titles |
| h2 | 1.5rem (24px) | Cabinet Grotesk | 700 | -0.5px | Section headers |
| h3 | 1.125rem (18px) | Instrument Sans | 600 | — | Ticket type names, checkout headings |
| body | 0.9375rem (15px) | Instrument Sans | 400 | — | Descriptions, form labels |
| small | 0.8125rem (13px) | Instrument Sans | 500 | — | Secondary info, captions |
| caption | 0.75rem (12px) | Geist | 500 | 0.5px | Date, venue, price labels |

**Usage in code:** `font-[family-name:var(--font-display)]` for Tailwind classes.

**Blacklist:** Never use Papyrus, Comic Sans, Lobster, Impact, Jokerman, Courier New (for body), or any decorative script fonts.

## Color

- **Approach:** Warm editorial. Restrained palette where color is rare and meaningful. The warm canvas is the signature.

### Default Tokens (warm editorial)
```css
--brand-primary: #2D2A26;    /* Warm near-black — primary buttons, strong actions */
--brand-accent: #8B6914;     /* Aged gold — links, highlights, selected states */
--theme-bg: #FAFAF8;         /* Warm off-white canvas */
--theme-surface: #F3F2EF;    /* Warm gray — cards, elevated surfaces */
--theme-text: #141312;       /* Warm charcoal — primary text */
--theme-text-muted: #7A756D; /* Warm gray — secondary text */
```

### Concert Theme (slightly cooler accent)
```css
--brand-primary: #2D2A26;
--brand-accent: #6B5CE7;     /* Cool violet — nightlife energy */
--theme-bg: #FAFAF8;
--theme-surface: #F3F2EF;
--theme-text: #141312;
--theme-text-muted: #7A756D;
```

### Conference Theme (navy accent)
```css
--brand-primary: #2D2A26;
--brand-accent: #1D4ED8;     /* Navy blue — trust, authority */
--theme-bg: #FAFAF8;
--theme-surface: #F3F2EF;
--theme-text: #141312;
--theme-text-muted: #7A756D;
```

### Sports Theme (warm red accent)
```css
--brand-primary: #2D2A26;
--brand-accent: #C53030;     /* Warm red — competition, energy */
--theme-bg: #FAFAF8;
--theme-surface: #F3F2EF;
--theme-text: #141312;
--theme-text-muted: #7A756D;
```

### Semantic Colors (consistent across all themes)
| Purpose | Hex | Usage |
|---------|-----|-------|
| Success | #16A34A | Checkout success, promo applied |
| Warning | #D97706 | Low capacity badges ("14 left") |
| Error | #DC2626 | Critical capacity, form errors, "Sold Out" |
| Info | #2563EB | Magic-link confirmation, informational banners |

### Color Rules
1. **Never hardcode hex colors in components.** Use `var(--brand-primary)`, `var(--theme-text)`, etc.
2. **For adaptive opacity:** Use `color-mix(in srgb, var(--theme-text) 15%, transparent)` — NOT `bg-white/15` or Tailwind opacity modifiers with hardcoded colors.
3. **Warm canvas is sacred.** All themes share the same `--theme-bg` and `--theme-surface`. Only `--brand-accent` changes per event type.
4. **Elevation:** Surfaces use `--theme-surface` (slightly darker than bg). Subtle borders at 8% opacity for separation.
5. **Contrast ratios:** All text on `--theme-bg`: min 4.5:1 (body), min 3:1 (large text 18px+).

### Organizer Brand Override
Organizers can set custom `brand_primary` and `brand_accent` colors in the besttix admin. These override the defaults at request time via `getServerSideProps`. Components should never assume a specific primary color.

## Spacing
- **Base unit:** 4px
- **Density:** Comfortable with generous whitespace
- **Scale:** 2xs(2px) xs(4px) sm(8px) md(16px) lg(24px) xl(32px) 2xl(48px) 3xl(64px) 4xl(80px)

## Layout
- **Approach:** Grid-disciplined with breathing room
- **Grid:** 2 cols mobile, 3 sm, 4 lg, 5 xl (event grid)
- **Max content width:** `max-w-6xl` (1152px)
- **Two-column pages:** Event detail and checkout use `md:flex md:gap-10` with `flex-1` left + `w-[360px]` sticky right sidebar

### Border Radius (hierarchical)
| Element | Radius | Token |
|---------|--------|-------|
| Event cards | 16px | `rounded-2xl` |
| Primary CTAs | 12px | `rounded-xl` |
| Secondary buttons | 10px | `rounded-[10px]` |
| Inputs | 12px | `rounded-xl` |
| Badges/chips | 9999px | `rounded-full` |
| Sidebar cards | 20px | `rounded-[20px]` |

### Shadows
- Event cards: **NO shadow** — poster fills card edge-to-edge, lift via subtle `translateY`
- Surface cards: Very subtle `shadow-[0_1px_3px_rgba(20,19,18,0.04)]`
- Sticky bottom CTA: `shadow-[0_-4px_20px_rgba(20,19,18,0.08)]` (soft upward shadow)

## Motion
- **Approach:** Minimal-functional
- **Easing:** enter(ease-out) exit(ease-in) move(ease-in-out)
- **Duration:** micro(50-100ms) short(150-250ms) medium(250-400ms)
- **Urgency pulse:** `animation: urgency-pulse 1.5s ease-in-out infinite` (critical capacity badge only)
- **`prefers-reduced-motion`:** All animations disabled.
- **Never animate:** `width`, `height`, `top`, `left` — only `transform` and `opacity`
- **Never use:** `transition: all` — always list specific properties

## Component Vocabulary

Built on HeroUI (`@heroui/react`). Never use raw HTML `<button>` or `<input>`.

| Component | HeroUI | Variant | Notes |
|-----------|--------|---------|-------|
| Primary CTA | `<Button>` | `variant="solid"` | Warm near-black bg (#2D2A26), warm white text, rounded-xl |
| Secondary CTA | `<Button>` | `variant="ghost"` | Outlined with theme-text border, subtle hover fill |
| Text input | `<Input>` | — | `rounded-xl`, warm border, warm surface bg |
| Chips/filters | `<Chip>` | `bordered` / `solid` | Active=solid brand-accent, inactive=bordered theme-text-muted |
| Tabs | `<Tab>` | — | Underline style, brand-accent for active |

### Custom Components
- `CapacityBadge` — 4-tier: Available (>20, hidden), Low (<=20, amber), Critical (<=5, red + pulse), Sold Out (0, red + strikethrough)
- `SessionPicker` — Horizontal scrollable date tabs with proper ARIA tablist/tab roles
- `StickyBuyBar` — Mobile-only bottom bar with price + CTA, `env(safe-area-inset-bottom)`
- `ShareButton` — Warm muted styling, subtle hover

## Accessibility

- **Touch targets:** Minimum 44x44px on all interactive elements
- **Focus:** `focus-visible` ring using `--brand-accent`, never `outline: none` without replacement
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
- Cookie-cutter section rhythm (hero -> 3 features -> testimonials -> pricing -> CTA)

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-04 | Warm off-white canvas (#FAFAF8) | Gallery aesthetic, differentiates from sterile-white (Eventbrite) and dark (DICE/Songkick) competitors |
| 2026-04-04 | Cabinet Grotesk 900 for display | Cinematic poster-energy headlines, distinctive in ticketing space |
| 2026-04-04 | Instrument Sans for body | Clean modern sans-serif, not overused, good Latin Extended support |
| 2026-04-04 | Near-black primary (#2D2A26) + gold accent (#8B6914) | Editorial luxury feel, deliberate departure from typical blue/purple CTAs |
| 2026-04-04 | Consistent warm canvas across event types | Only accent color changes per event type, warm bg stays the same |
| 2026-04-04 | Subtle borders at 8% opacity | Warmer, softer separation than previous 10-12% |
| 2026-04-04 | Rounded-xl (12px) buttons instead of rounded-full pills | More editorial, less generic SaaS |
