const KALSHI_EVENTS_URL = 'https://api.elections.kalshi.com/trade-api/v2/events'

// Normalize a raw Kalshi dollar-string price to 0–1 probability.
// Kalshi API returns prices as dollar strings like "0.0900" (range 0–1).
function toProb(val) {
  if (val == null) return null
  const n = typeof val === 'string' ? parseFloat(val) : val
  if (isNaN(n)) return null
  if (n >= 0 && n <= 1) return n
  // Legacy integer cents (0–100) fallback
  if (n > 1 && n <= 100) return n / 100
  return null
}

export async function fetchKalshiMarkets() {
  const allMarkets = []
  let cursor = null
  // Covers the full 5,000+ open-event universe (30 pages × 200, cursor-paginated).
  const maxPages = 30

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      status: 'open',
      limit: '200',
      with_nested_markets: 'true',
    })
    if (cursor) params.set('cursor', cursor)

    let res
    try {
      res = await fetch(`${KALSHI_EVENTS_URL}?${params}`, { cache: 'no-store' })
    } catch (err) {
      console.error(`[kalshi] Network error on page ${page}:`, err.message)
      break
    }

    if (res.status === 429) {
      // Rate limited — brief backoff and one retry. A page that still
      // fails after that just ends pagination here; returning the
      // markets already collected beats throwing them all away.
      await new Promise(r => setTimeout(r, 1500))
      res = await fetch(`${KALSHI_EVENTS_URL}?${params}`, { cache: 'no-store' }).catch(() => null)
    }

    if (!res || !res.ok) {
      console.error(`[kalshi] Page ${page} failed (${res?.status ?? 'network error'}) — stopping pagination with ${allMarkets.length} markets collected so far`)
      break
    }

    const data = await res.json()
    const events = data.events || []

    for (const event of events) {
      const markets = event.markets || []
      if (markets.length === 0) continue

      const isMultiMarket = markets.length > 1
      const eventTicker = event.event_ticker || ''

      // Output EACH nested market individually so we can match
      // specific candidates/outcomes across platforms
      for (const mkt of markets) {
        // Skip settled/resolved markets
        if (mkt.result) continue

        const rawBid = mkt.yes_bid_dollars ?? mkt.yes_bid
        const rawAsk = mkt.yes_ask_dollars ?? mkt.yes_ask
        const rawLast = mkt.last_price_dollars ?? mkt.last_price

        const bid = toProb(rawBid)
        const ask = toProb(rawAsk)
        const last = toProb(rawLast)

        let prob = null
        let priceSource = null

        if (bid != null && ask != null) {
          prob = (bid + ask) / 2
          priceSource = 'midpoint'
        } else if (last != null) {
          prob = last
          priceSource = 'lastPrice'
        }

        if (prob === null) continue

        // For multi-market events (e.g. "Who will be Pope?" with 7 candidates),
        // append the candidate/sub_title to make matching specific.
        // For single-market events, just use the event title.
        const subTitle = mkt.yes_sub_title || ''
        let question = event.title || mkt.title || ''
        if (isMultiMarket && subTitle) {
          question = `${question} - ${subTitle}`
        }

        if (!question) continue

        // Detect VP (Vice Presidential) tickers — Kalshi uses KXVPRESNOM* for VP
        // but the event title misleadingly says "presidential nomination".
        // Fix the question text so fingerprinting can distinguish them.
        const rawTickerFull = mkt.ticker || ''
        if (/^KXVPRESNOM/i.test(rawTickerFull) || /^KXVPRESNOM/i.test(eventTicker)) {
          question = question
            .replace(/\bpresidential\b/gi, 'vice presidential')
            .replace(/\bPresidential\b/g, 'Vice Presidential')
        }

        // Kalshi URLs use the base event ticker (strip numeric/candidate suffixes)
        // e.g. KXPRESNOMD-28-MK → kxpresnomd, KXELONMARS-99 → kxelonmars
        const rawTicker = eventTicker || mkt.ticker || ''
        const tickerBase = rawTicker.replace(/-\d+.*$/, '').toLowerCase()
        const url = tickerBase
          ? `https://kalshi.com/markets/${tickerBase}`
          : null

        allMarkets.push({
          question,
          prob,
          priceSource,
          volume: parseFloat(mkt.volume_fp || mkt.volume) || 0,
          openInterest: parseFloat(mkt.open_interest_fp || mkt.open_interest) || 0,
          volume24h: parseFloat(mkt.volume_24h_fp || mkt.volume_24h) || 0,
          category: event.category || '',
          endDate: mkt.close_time || mkt.expiration_time || null,
          description: mkt.rules_primary || '',
          // Only a genuine multi-candidate suffix when isMultiMarket —
          // Kalshi's API populates yes_sub_title even for single-outcome
          // markets (e.g. "Before 2050", "Mars"), which aren't a specific
          // "answer" to gate matching against, just generic subject/
          // threshold labels already captured by the other fingerprint
          // signals (topic, numeric target, dates).
          yesSubTitle: isMultiMarket ? subTitle : null,
          url,
          source: 'kalshi',
          // Event grouping — lets the matcher match multi-outcome events
          // (e.g. "NBA Finals Winner") before matching individual teams/candidates.
          eventKey: isMultiMarket ? eventTicker : null,
          eventTitle: isMultiMarket ? (event.title || null) : null,
          _eventTitle: event.title || '',
          _eventTicker: eventTicker,
          _raw: { bid: rawBid, ask: rawAsk, last: rawLast, ticker: mkt.ticker },
        })
      }
    }

    cursor = data.cursor
    if (!cursor || events.length < 200) break

    // Small courtesy delay between pages — 30 sequential requests back to
    // back is enough to trip Kalshi's rate limit under load. We have a
    // generous time budget (the cron route's maxDuration), so this is cheap.
    await new Promise(r => setTimeout(r, 150))
  }

  return allMarkets
}
