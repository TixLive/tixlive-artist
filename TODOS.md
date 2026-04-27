# TODOS

## Auth-Aware Checkout (post-v0.1.5.0 follow-ups)

**[P1] Server-side checkout session (replaces form-POST cart transport)**
- **What:** Migrate the event-page → checkout cart transport from hidden form-POST to a server-managed session. Event page calls `POST /api/checkout/session` (proxy to besttix), receives `{session_id}`, redirects to `/checkout?session=<uuid>`. Checkout GSSP fetches the session payload by id.
- **Why:** Form-POST cart survives one request only. Migration unblocks magic-link-during-checkout, abandoned-cart email, Apple/Google Pay handoff, resumable checkout via shareable link, and gives the server price authority instead of trusting the client cart payload.
- **Context:** Plan `~/.gstack/projects/TixLive-tixlive/main-checkout-attendee-overview-20260426-155221.md` § 0C-bis axis T3. Backend table + endpoint live in besttix repo (companion P1 TODO there).
- **Effort:** L (human: ~1-2 days / CC: ~2hrs for the proxy + GSSP swap)
- **Depends on:** Backend `checkout_session` table + endpoint shipped in besttix.

**[P2] Apple Pay / Google Pay native checkout**
- **What:** Add Apple/Google Pay buttons to `<PaymentDetailsSlot>`. Use Stripe `paymentRequest` API for the WebKit/Chrome variant.
- **Why:** Mobile-dominant ticketing audience. One-tap re-purchase is table stakes (Eventbrite, DICE).
- **Effort:** M (human: ~1 week / CC: ~1hr)
- **Depends on:** Server-side checkout session.

**[P2] Phone capture-on-checkout (auto-persist)**
- **What:** When an authed attendee uses the inline `[+ Add phone]` link in `<AttendeeIdentityRow>`, persist phone to their User row as part of the order flow (not via the profile drawer).
- **Why:** RO/RU markets use SMS-ticket delivery. Capturing phone at the moment of intent raises completion vs forcing the user through the profile drawer.
- **Effort:** S (human: ~2hrs / CC: ~20min)
- **Depends on:** Backend `/api/public/order/buy` accepting an optional phone update for authed users.

**[P3] Component tests (Vitest + React Testing Library)**
- **What:** Wire Vitest into tixlive-artist (no test framework today). Add snapshot tests for `<AttendeeIdentityRow>` covering the 5 states from the design phase: complete, phone-missing, name-missing (PROFILE_INCOMPLETE), loading, SSR-error.
- **Why:** Catch layout regressions and missing-state regressions before they reach prod. Plan listed these as deferred.
- **Effort:** M (wiring + tests)
- **Depends on:** None

**[P3] Proxy unit tests for `/api/order/buy`**
- **What:** Once Vitest is wired, add tests covering: (a) cookie present → Bearer forwarded + PII stripped from forwarded body; (b) cookie absent → Bearer NOT forwarded, body unchanged; (c) refresh-fail → Bearer not forwarded.
- **Why:** Proxy carries security responsibility (the body-strip is the defense-in-depth layer #1). Regressions here would silently allow client identity smuggling.
- **Effort:** S (human: ~2hrs / CC: ~20min once Vitest is wired)
- **Depends on:** Vitest wired up (P3 above).

**[P3] Integration test for `/checkout` GSSP**
- **What:** Test the three SSR branches: (a) authed cookie + getMe success → `me` prop populated, identity row rendered; (b) authed cookie + getMe fail → `me=null` + `meError=true` + anonymous form with banner; (c) anonymous → form unchanged.
- **Why:** GSSP branch logic is load-bearing for the auth-aware checkout. Hard to QA manually after every refactor.
- **Effort:** S (~1hr)
- **Depends on:** Vitest wired up.

**[P3] Mobile QA pass at 375px viewport**
- **What:** Manual QA pass on a real mobile device or 375px DevTools emulation. Verify: (1) `<AttendeeIdentityRow>` truncation behavior with long names, (2) lock icon (added in Fix B) shows on mobile, (3) Drawer takes full screen, (4) Pay button distance to fold.
- **Why:** Tested on desktop only during initial /autoplan QA. Mobile is the dominant ticketing surface.
- **Effort:** S (~30min)
- **Depends on:** Production-style build (not dev).

**[P3] Magic-link cleanup PR (sibling)**
- **What:** Companion to the magic-link cleanup TODO in besttix — once magic-link endpoints are removed in besttix, audit tixlive-artist for any callers (probably none, since `/api/me` proxy uses email-OTP via `/api/public/auth/email-code`).
- **Why:** Stale references to dead endpoints generate runtime 404s if users somehow trigger them.
- **Effort:** S (~10min audit)
- **Depends on:** besttix magic-link cleanup PR landed.
