# Polshi — Claude Code Context

## Project
- **Stack:** Next.js 15 (App Router) + React 19 + Supabase + Stripe + NextAuth v5
- **CSS:** Custom properties design system (light-first default) + Tailwind v4
- **Styles:** `src/styles/landing.css`, `src/styles/dashboard.css`, `src/styles/auth.css`, `src/app/globals.css`
- **Font:** Inter via next/font/google
- **APIs:** Polymarket Gamma API + Kalshi Trade API

## Route Structure
- `/` — Homepage (search hero + trending markets)
- `/(app)/arbitrage` — Arbitrage scanner
- `/(app)/explore` — Market exploration
- `/(app)/whales` — Whale tracking
- `/(app)/hub` — Dashboard hub
- `/(app)/differences` — Market differences
- `/(app)/volume` — Volume dashboard
- `/(app)/pricing` — Pricing page
- `/(app)/watchlist` — Pro watchlist
- `/(app)/settings` — Account settings
- Shared layout: `src/app/(app)/layout.jsx` with Navbar component

## Key Patterns
- Theme: light-first (`:root` = light, `html[data-theme="dark"]` = dark overrides)
- Navbar: `src/components/shared/Navbar.jsx`
- Platform badges: `.badge-polymarket` (blue), `.badge-kalshi` (green)
- Live indicators: `.live-badge` + `.live-dot` with pulse animation
- Pro defaults hardcoded to `'pro'` in `auth.js` for local dev (no Supabase connection)

---

## Active Work: Homepage Rebuild (Phase 1)

**Status as of 2026-03-30:** Design spec is fully written and approved. Ready to implement.

**Spec:** `docs/superpowers/specs/2026-03-26-homepage-rebuild-design.md`

### What the rebuild does
Replaces the current homepage with a dark, conversion-focused landing page. Goal: convert visitors into sign-ups by showing real profit data immediately.

- **Design:** Near-black (`#08080c`) hero, indigo (`#5e6ad2`) accents, green (`#10b981`) for profit numbers
- **Dark sections use `.homepage-dark` class overrides** — does NOT change global light theme
- **All data fetched server-side** in `src/app/page.jsx` — no client-side fetching on homepage

### Components to build (all in `src/components/home/`)
| Component | File | Status |
|---|---|---|
| Hero | `Hero.jsx` | Rebuild |
| Proof Strip | `ProofStrip.jsx` | New |
| Top Arb of Yesterday | `TopArbYesterday.jsx` | Rebuild |
| Performance Section | `ArbPerformance.jsx` | Rebuild |
| Whale of the Day | `WhaleYesterday.jsx` | Rebuild |
| Scanner Preview | `ScannerPreview.jsx` | Rebuild |
| Why Polshi | `WhyPolshi.jsx` | Rebuild |
| Pricing CTA | `PricingCTA.jsx` | New |

### Page section order
1. Hero
2. Proof Strip
3. Top Arb of Yesterday
4. Performance Section
5. Whale of the Day
6. Scanner Preview
7. Why Polshi
8. Pricing CTA
9. Footer (existing, unchanged)

### Sections removed
- `MarketDominance`
- `TopWhales` (list) — replaced by single WhaleYesterday card
- `SportsbookComingSoon`
- `ShootingStars` / `Particles` animations

### What does NOT change
- Global CSS variables and theme system
- Navbar component
- Auth flow
- App routes
- All API routes
- Footer

### Next step
Begin implementation. Start with `src/app/page.jsx` (server component, data fetching) then build components section by section per the spec.

---

## Session Handoff Notes
_Updated each session so the next conversation knows exactly where we left off._

**Last session (2026-03-30):** Design spec was completed on 2026-03-26. Session was about resuming context after project files were moved to `/Volumes/1tbswitch/polshi`. This CLAUDE.md was created. Implementation has not started yet — we are ready to begin.
