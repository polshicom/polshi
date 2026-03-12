const KALSHI_EVENTS_URL = 'https://trading-api.kalshi.com/trade-api/v2/events'

// Normalize a raw Kalshi price value to 0–1 probability.
// Kalshi native scale is integer cents 0–100.
function toProb(val) {
  if (val == null || isNaN(val)) return null
  // Kalshi values are 0–100 integers (cents)
  if (val >= 0 && val <= 100) return val / 100
  return null // out of range
}

export async function fetchKalshiMarkets() {
  const allMarkets = []
  let cursor = null
  const maxPages = 5

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      status: 'open',
      limit: '200',
      with_nested_markets: 'true',
    })
    if (cursor) params.set('cursor', cursor)

    const res = await fetch(`${KALSHI_EVENTS_URL}?${params}`, {
      cache: 'no-store',
    })

    if (!res.ok) throw new Error(`Kalshi API error: ${res.status}`)

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

        const rawBid = mkt.yes_bid
        const rawAsk = mkt.yes_ask
        const rawLast = mkt.last_price

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
          volume: mkt.volume || 0,
          openInterest: mkt.open_interest || 0,
          volume24h: mkt.volume_24h || 0,
          category: event.category || '',
          endDate: mkt.close_time || mkt.expiration_time || null,
          description: mkt.rules_primary || '',
          yesSubTitle: subTitle,
          url,
          source: 'kalshi',
          _raw: { bid: rawBid, ask: rawAsk, last: rawLast, ticker: mkt.ticker },
        })
      }
    }

    cursor = data.cursor
    if (!cursor || events.length < 200) break
  }

  return allMarkets
}
