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

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
- Save progress, checkpoint, resume → invoke checkpoint
- Code quality, health check → invoke health
