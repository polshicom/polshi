# Polshi Homepage Rebuild — Phase 1 Design Spec

**Date:** 2026-03-26
**Scope:** Homepage (`/`) only. Phase 2 (product depth) is a separate spec.
**Goal:** Convert visitors into sign-ups by aggressively communicating money-making value.

---

## Design Direction

- **Background:** Near-black (`#08080c`) for hero and key sections
- **Accent:** Indigo (`#5e6ad2`) for CTAs, highlights, and interactive elements
- **Data accents:** Green (`#10b981`) for profit/positive numbers, muted grey for labels
- **Tone:** Landing page first, terminal second. Convert first, impress second.
- **Feel:** Premium, dark, urgent — not dashboard-y or overly technical

---

## Architecture

### Data Flow

`src/app/page.jsx` remains a **server component**. All data fetched server-side, passed as props to child components. No client-side data fetching on the homepage.

| Data | Source | Notes |
|---|---|---|
| Proof strip stats | `/api/scanner-stats` | Markets scanned, live opportunities, profit found |
| Top Arb of Yesterday | `/api/top-arb` | Single best arb object |
| Whale of the Day | `/api/whale-yesterday` | Largest single trade |
| Scanner preview rows | `/api/markets?limit=5` | Top 5 matched markets |
| Performance chart | Hardcoded in component | Simulated monthly data, Jan 2025–Mar 2026 |

No new API endpoints required for Phase 1.

### Components

| Component | File | Status |
|---|---|---|
| Hero | `src/components/home/Hero.jsx` | Rebuild |
| Proof Strip | `src/components/home/ProofStrip.jsx` | New |
| Top Arb of Yesterday | `src/components/home/TopArbYesterday.jsx` | Rebuild |
| Performance Section | `src/components/home/ArbPerformance.jsx` | Rebuild |
| Whale of the Day | `src/components/home/WhaleYesterday.jsx` | Rebuild |
| Scanner Preview | `src/components/home/ScannerPreview.jsx` | Rebuild |
| Why Polshi | `src/components/home/WhyPolshi.jsx` | Rebuild |
| Pricing CTA | `src/components/home/PricingCTA.jsx` | New |

All components are client components only if they need interactivity (e.g., chart rendering). Otherwise they stay server components receiving data as props.

### CSS

`src/styles/landing.css` updated. Homepage dark sections use local class overrides (`.homepage-dark`) — they do **not** change the global theme, which stays light-first. The existing Navbar, auth pages, and app routes are unaffected.

---

## Section Specs

### 1. Hero

**Goal:** In 3 seconds, the visitor knows: there is money here, and Polshi shows them where it is.

**Layout:** Full-width dark section, centered content, single column.

**Elements:**
- Small `LIVE` badge (pulsing green dot + "LIVE · 47 price gaps open now") above the headline
- **Headline:** `"Find the better price. Take the trade."`
- **Subheadline:** `"Polymarket and Kalshi price the same events differently. Polshi shows you where, how much profit is available, and which side to take — updated in real time."`
- **Buttons:**
  - Primary: `Start Free` — indigo filled, white text
  - Secondary: `View Live Scanner →` — ghost, indigo text
- No background animations. Clean, fast, no distractions.

**Copy rules:**
- Headline is a two-step action sequence: find → take. No jargon.
- Subheadline names the two platforms, explains the mechanism in plain English, ends on "updated in real time" as the urgency hook.
- "Arbitrage" is not used in the hero. Save it for the scanner.

---

### 2. Proof Strip

**Goal:** Instant credibility. Real numbers, right now.

**Layout:** Tight horizontal bar below the hero. Slightly lighter dark background. Four stats in a row separated by indigo dots.

**Stats (pulled from `/api/scanner-stats`):**
- `2,847` — *markets checked*
- `47` — *price gaps found*
- `$12,400` — *profit available today* — computed as `sum(edge * 1000)` across all matched markets with confidence >= HIGH. If the field does not exist in the current API response, add it to the `/api/scanner-stats` route during implementation.
- `Updated 30s ago` — *freshness signal* — derived from cache age

All labels use plain language. No "edge," no "arbitrage," no technical terms.

**Design:**
- Numbers in large white text, labels in muted grey below
- "Updated Xs ago" uses green dot for recency signal
- No borders or card chrome — just numbers in a strip

---

### 3. Top Arb of Yesterday

**Goal:** Show one concrete example of a profitable trade that was available. Make it feel real and actionable.

**Section label:** `"Best trade yesterday"`

**Layout:** Single prominent card, full-width or wide-centered. Two columns: left = market context, right = numbers.

**Left column:**
- Market name (truncated to 2 lines)
- Category tag (e.g., `POLITICS`, `CRYPTO`)
- Platform badges: `Polymarket` (blue) + `Kalshi` (green)
- One-line description: `"These two platforms had different prices on the same event."`

**Right column:**
- Polymarket price: `62%`
- Kalshi price: `54%`
- **Price difference:** `8%` — large indigo text, labeled "price gap"
- **Profit per $1,000:** `+$84` — large green text. This is the primary number.
- **Confidence:** badge (`HIGH` / `MEDIUM`)
- **Directional label:** `Better price on Polymarket` — shown only when confidence is HIGH. Derived from which platform prices YES lower.
- Last updated: small grey timestamp

**Rules:**
- "BUY ON X" and "edge" language are never used.
- Label the price gap "price gap" or "difference" — not "edge" or "arbitrage."
- If `top-arb` returns null, hide the section entirely.
- If confidence is not HIGH, omit the directional label.

---

### 4. Performance Section

**Goal:** Make the bankroll example the hero. Make it feel real over a long time period.

**Layout:** Dark section, centered. Chart above, stat blocks below.

**Section title:** `"What a $1,000 bankroll looked like this year"`

**Chart:**
- Recharts `AreaChart`
- Simulated monthly cumulative return data: **Jan 2025 through Mar 2026** (15 months)
- Indigo fill with low opacity, indigo stroke
- Smooth curve showing steady growth with minor dips (realistic, not a perfect hockey stick)
- No axis labels except month names on X-axis — clean

**Sample data shape (hardcoded in component):**
```
Jan 2025: +2.1%
Feb 2025: +1.8%
Mar 2025: +3.4%
Apr 2025: +2.9%
May 2025: +4.1%
Jun 2025: +1.2%
Jul 2025: +3.8%
Aug 2025: +2.5%
Sep 2025: +4.7%
Oct 2025: +3.1%
Nov 2025: +2.8%
Dec 2025: +3.6%
Jan 2026: +2.2%
Feb 2026: +3.9%
Mar 2026: +2.1% (partial)
```
Cumulative result: ~+44% over 15 months.

**Below chart — two stat blocks:**
- **Primary (large):** `$1,000 → $1,440` — white, large, bold. This is the first number the eye lands on.
- **Secondary (smaller):** `+44% · Jan 2025 – Mar 2026` — indigo, smaller, sits below or beside the primary
- Bankroll example must be visually 2× the size of the percentage figure.

**Disclaimer (below stats):**
`"Based on tracked price gaps and estimated fills. Real results may vary."`
Small, grey, italic. Required. Never remove. "Price gaps" used instead of "arbitrage."

---

### 5. Whale of the Day

**Goal:** Show that real money is moving on these markets.

**Layout:** Compact single card. Horizontal layout: icon/badge left, details right.

**Elements:**
- **Section title:** `"Largest Trade Today"` — always. "Whale of the Day" is not used unless the trade is genuinely large (>$50,000). Logic: if `trade.dollarValue >= 50000`, use "Whale of the Day", else use "Largest Trade Today".
- Market name (1 line, truncated)
- Direction badge: `YES` (green) or `NO` (red)
- Dollar size: `$14,200` — white, medium-large
- Platform badge: Polymarket (blue) or Kalshi (green)
- Timestamp: `2 hours ago`
- One-line context: constructed as `"[Large/Big] [YES/NO] position on [market name]"`. Use "Large" if `dollarValue >= 10000`, else "Big". Example: `"Large YES position on Will Trump win in 2026?"`

**Rules:**
- If `whale-yesterday` API returns null, hide section
- Never inflate the size — show exactly what the API returns

---

### 6. Scanner Preview

**Goal:** Make users feel the product is right there, just barely out of reach.

**Layout:** Table-style section. 5 rows. Clean, minimal columns.

**Columns (4 only):**
| Event | Price Gap | Profit / $1k | Confidence |
|---|---|---|---|
| Will Trump win the 2026 midterms? | 8.4% | +$84 | HIGH |

Column headers use plain language: "Price Gap" not "Edge," "Profit / $1k" stays as-is (already clear).

**Visibility:**
- **Rows 1–3:** Fully visible. Use real data from `/api/markets?limit=5` top 3.
- **Rows 4–5:** Blurred (`filter: blur(4px)`, `pointer-events: none`). Frosted dark overlay centered over them.
- Overlay content: Lock icon + `"See all open price gaps"` + `"Open Full Scanner →"` button (indigo filled)
- Button routes: if user is authed → `/arbitrage`; if not → `/login?callbackUrl=/arbitrage`

**Design rules:**
- Rows must look genuinely valuable, not like test data
- "Price Gap" and "Profit / $1k" columns use green text
- Confidence shown as `HIGH` / `MED` badge, not a number
- No extra columns. Four is the maximum.
- Table has no external border — rows separated by subtle dark dividers only

---

### 7. Why Polshi

**Goal:** Three punchy reasons. No explanation, just hooks.

**Layout:** Three cards in a row. Dark card background, indigo icon accent.

**Cards:**

1. **Find price gaps**
   Icon: arrows crossing
   Copy: `"See where Polymarket and Kalshi disagree. Take the better price."`

2. **See who's buying big**
   Icon: eye or wave
   Copy: `"Track the largest trades happening right now. Follow the money."`

3. **Compare any market**
   Icon: split/compare
   Copy: `"Same event, two platforms, side by side. Spot the difference fast."`

**Rules:**
- Card titles are plain-language action phrases, not product feature names.
- Two sentences max. Both answer: "what do I get and why does it matter?"
- No bullet lists inside cards.

---

### 8. Pricing CTA

**Goal:** Make the free tier feel limited and the pro tier feel like the version that actually works.

**Layout:** Full-width dark card near the bottom of the page. Bold headline, two-column free/pro comparison, CTA buttons.

**Headline:** `"Stop missing trades."`
**Subheadline:** `"Free shows you the surface. Pro shows you everything."`

**Free column (feels limited):**
- See 5 markets
- Updates every 15 minutes
- ✗ No alerts
- ✗ No whale trades
- ✗ No watchlist
- Label: `Free` — muted styling, no elevation

**Pro column (feels action-ready):**
- See every open price gap
- Updates every 15 seconds
- ✓ Get alerted when gaps appear
- ✓ See the biggest trades in real time
- ✓ Save markets and get notified
- ✓ Discord alerts
- Label: `Pro` — indigo styling, slightly elevated card

Copy uses "see," "get," "save" — plain verbs. No "edge," no "analytics."

**Buttons:**
- `Start Free` — ghost/secondary
- `Get Pro →` — indigo filled, primary

**Urgency note below buttons:**
`"Price gaps close fast. Free updates every 15 minutes. By then, the trade may be gone."`

---

## Page Order

```
1. Hero
2. Proof Strip
3. Top Arb of Yesterday
4. Performance Section
5. Whale of the Day
6. Scanner Preview
7. Why Polshi
8. Pricing CTA
9. Footer (existing)
```

Sections that return no data (top-arb null, whale null) are hidden entirely — no empty states shown on the homepage.

---

## Removed Sections

The following homepage sections from the current design are **removed** in Phase 1:

- `MarketDominance` — not conversion-focused, abstract
- `TopWhales` (list of 5) — replaced by single Whale of the Day
- `SportsbookComingSoon` — distraction, not relevant
- `ShootingStars` / `Particles` animations — removed for performance and cleanliness

---

## What Does Not Change

- Global CSS variables and theme system
- Navbar component
- Auth flow
- App routes (`/arbitrage`, `/whales`, `/explore`, etc.)
- All API routes
- Footer

---

## Success Criteria

1. A new visitor understands within 5 seconds that Polshi finds profitable opportunities between two platforms
2. The bankroll example (`$1,000 → $1,440`) is the most visually prominent number on the page after the headline
3. The scanner preview creates desire — the blur/lock should make users want to see the rest, not feel blocked
4. Every section passes the test: "Does this make someone more likely to sign up?" If not, it's removed
