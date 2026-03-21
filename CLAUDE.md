# CLAUDE.md — tixlive-artist

## What This Is
White-label public ticketing platform for event organizers. Each organizer gets their own branded site deployed to Vercel. This repo is the frontend — all data comes from the besttix backend API.

## Commands
```bash
npm run dev      # Start dev server (Next.js 16 + Turbopack)
npm run build    # Production build
npm run lint     # ESLint
```

## Tech Stack
- **Next.js 16** (Pages Router, NOT App Router) with TypeScript
- **Tailwind CSS v4** + **HeroUI** (`@heroui/react`) for UI components
- **Icons**: `@iconify/react`
- **i18n**: `next-i18next` (en, ro, ru)
- **Data fetching**: `getServerSideProps` calling besttix REST API
- **Forms**: `react-hook-form` v7 + Zod v4

## Key Conventions
- `@/*` maps to `src/*`
- All pages use `getServerSideProps` + `serverSideTranslations`
- Mock data via `USE_MOCKS=true` env var with `src/mocks/data.ts`
- Event-type theming via `[data-event-type]` CSS attribute on `<main>`
- Never hardcode hex colors — use CSS custom properties (`--brand-primary`, `--theme-text`, etc.)
- Use `color-mix(in srgb, var(--theme-text) X%, transparent)` for adaptive opacity (NOT `bg-white/X`)

## Design System
Always read `DESIGN.md` before making any visual or UI decisions.
All font choices, colors, spacing, and aesthetic direction are defined there.
Do not deviate without explicit user approval.
In QA mode, flag any code that doesn't match DESIGN.md.
