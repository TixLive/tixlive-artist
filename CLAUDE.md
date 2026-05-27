# CLAUDE.md — tixlive-artist

## What This Is
White-label public ticketing platform for event organizers. Each organizer gets their own branded site deployed to **Cloudflare Pages** (static export at the organizer's custom domain). This repo is the frontend — all data is fetched **directly from the browser** to the besttix REST API. No SSR proxies, no server-side data fetching.

## Commands
```bash
npm run dev      # Start dev server (Next.js 16 + Turbopack)
npm run build    # Production build (output: 'export' — static)
npm run lint     # ESLint
```

## Tech Stack
- **Next.js 16** (Pages Router, NOT App Router) with TypeScript
- **Build target**: static export (`output: 'export'` in prod; dev runs the Next server so rewrites work)
- **Tailwind CSS v4** + **HeroUI** (`@heroui/react`) for UI components
- **Icons**: `@iconify/react`
- **i18n**: `next-i18next` (en, ro, ru)
- **Data fetching**: **TanStack Query** hooks calling besttix REST API directly from the browser via `ApiService` (see Data Layer below)
- **Forms**: `react-hook-form` v7 + Zod v4

## Key Conventions
- `@/*` maps to `src/*`
- Pages use `getStaticProps` + `serverSideTranslations` (static export means no `getServerSideProps`)
- Dynamic routes (`[slug]`, `[ticketId]`, `[token]`, `[page]`) use a `'_'` placeholder shell in `getStaticPaths` and read the real param from `window.location.pathname` on mount
- Event-type theming via `[data-event-type]` CSS attribute on `<main>`
- Never hardcode hex colors — use CSS custom properties (`--brand-primary`, `--theme-text`, etc.)
- Use `color-mix(in srgb, var(--theme-text) X%, transparent)` for adaptive opacity (NOT `bg-white/X`)

## Data Layer

### ApiService (`src/services/Api.Service.ts`)
The single HTTP client for the besttix backend. Never bypass it (no raw `fetch` to besttix in pages/components).

- **Org identity**: adds `x-site-domain: <hostname>` in production; `x-org-id: <NEXT_PUBLIC_ORG_ID>` on localhost.
- **Auth**: sends `Authorization: Bearer <attendee_token>` if the cookie is set. On 401, transparently calls `/api/public/auth/refresh`, swaps tokens, retries **once**. Concurrent refreshes are deduplicated via `inflightRefresh`.
- **Errors**: throws `ApiError` with `status` + `code` (extracted from response body). Use `instanceof ApiError` to branch on error codes.
- Methods: `get<T>(path)`, `post<T>(path, body?)`, `patch<T>`, `put<T>`, `delete<T>`. All return the parsed JSON as `T`.

### Queries (`src/queries/[domain]/use*.ts`)
**Every besttix call lives in a React Query hook** under `src/queries/<domain>/`. One hook per endpoint. Pattern:

```ts
// queries/me/useGetMe.ts
export const GetMeKey = 'me';
export const useGetMe = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: [GetMeKey],
    queryFn: async () => ApiService.get<IMe>('/api/public/me'),
    enabled,
    retry: 0,
  });
```

Mutations use the same folder structure:

```ts
// queries/me/useUpdateMe.ts
export const useUpdateMe = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: IMeUpdate) => ApiService.patch<IMe>('/api/public/me', body),
    onSuccess: (data) => queryClient.setQueryData([GetMeKey], data),
  });
};
```

When a page needs to orchestrate several calls inside a single `useEffect` (e.g. `events/[slug]/seats.tsx`, `checkout/index.tsx`), export a plain async helper alongside the hook (`fetchEvent`, `fetchSeating`, `suggestSeats`) — same `ApiService` underneath, just without the React Query layer.

### Auth (`src/contexts/AuthContext.tsx`, `src/components/auth/ProtectedRoute.tsx`)
- `<AuthProvider>` sits below `QueryClientProvider` in `_app.tsx`. It exposes `useAuth() → { user, loading, signOut, refresh }`. `user` is the result of `useGetMe()`; `signOut()` clears tokens + resets the cache; `refresh()` is called after a successful login to repopulate the user.
- Pages that require login wrap their content in `<ProtectedRoute>`. The guard redirects to `/login?from=<asPath>` when `!loading && !user`. Inside the guarded subtree, `user` is non-null — extract page content into a sub-component so it can safely use `user!`.
- The login page reads `?from=` (with `?next=` as a fallback) and redirects there after `refresh()` completes.

Cookies (`attendee_token`, `attendee_refresh`) are **JS-readable** by design — there is no SSR proxy. This is an explicit XSS trade-off in exchange for the direct-to-API architecture (see commit `db5f4cb`).

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

## gstack (REQUIRED — global install)

**Before doing ANY work, verify gstack is installed:**

```bash
test -d ~/.claude/skills/gstack/bin && echo "GSTACK_OK" || echo "GSTACK_MISSING"
```

If GSTACK_MISSING: STOP. Do not proceed. Tell the user:

> gstack is required for all AI-assisted work in this repo.
> Install it:
> ```bash
> git clone --depth 1 https://github.com/garrytan/gstack.git ~/.claude/skills/gstack
> cd ~/.claude/skills/gstack && ./setup --team
> ```
> Then restart your AI coding tool.

Do not skip skills, ignore gstack errors, or work around missing gstack.

Using gstack skills: After install, skills like /qa, /ship, /review, /investigate,
and /browse are available. Use /browse for all web browsing.
Use ~/.claude/skills/gstack/... for gstack file paths (the global path).
