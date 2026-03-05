const GAMMA_URL = 'https://gamma-api.polymarket.com/markets'

// Normalize a raw price value to 0–1 probability.
// Polymarket uses 0–1 natively, but guard against any 0–100 values.
function toProb(val) {
  if (val == null || isNaN(val)) return null
  if (val > 1 && val <= 100) return val / 100
  if (val >= 0 && val <= 1) return val
  return null
}

// Parse outcomes field — may be a JSON string or an array
function parseJsonField(val) {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return null }
  }
  return null
}

export async function fetchPolymarketMarkets() {
  // Fetch multiple pages to get broader coverage (including sports, crypto, etc.)
  const allData = []
  const pageSize = 200
  const maxPages = 3

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      active: 'true',
      closed: 'false',
      limit: String(pageSize),
      offset: String(page * pageSize),
      order: 'volumeNum',
      ascending: 'false',
    })

    const res = await fetch(`${GAMMA_URL}?${params}`, {
      cache: 'no-store',
    })

    if (!res.ok) throw new Error(`Polymarket API error: ${res.status}`)

    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) break
    allData.push(...data)
    if (data.length < pageSize) break
  }

  const results = []

  for (const m of allData) {
    if (!m.question) continue

    // Skip markets that are no longer accepting orders
    if (m.acceptingOrders === false) continue

    // Parse outcomes and outcomePrices as JSON (both can be strings)
    const outcomes = parseJsonField(m.outcomes)
    const outcomePrices = parseJsonField(m.outcomePrices)

    // Only include binary Yes/No markets
    if (!Array.isArray(outcomes) || outcomes.length !== 2) continue
    if (!Array.isArray(outcomePrices) || outcomePrices.length !== 2) continue

    const labels = outcomes.map(o => String(o).toLowerCase())
    const yesIndex = labels.indexOf('yes')
    const noIndex = labels.indexOf('no')

    // Must have exactly one "yes" and one "no"
    if (yesIndex === -1 || noIndex === -1 || yesIndex === noIndex) continue

    // Extract the YES outcome price using the correct index
    const rawOutcomeYes = parseFloat(outcomePrices[yesIndex])
    if (isNaN(rawOutcomeYes)) continue

    // Parse bid/ask/last (these correspond to the YES token on Polymarket)
    const rawBid = m.bestBid != null ? parseFloat(m.bestBid) : null
    const rawAsk = m.bestAsk != null ? parseFloat(m.bestAsk) : null
    const rawLast = m.lastTradePrice != null ? parseFloat(m.lastTradePrice) : null

    // Normalize each to 0–1 probability
    const bid = toProb(rawBid)
    const ask = toProb(rawAsk)
    const last = toProb(rawLast)
    const outcomeYes = toProb(rawOutcomeYes)

    // Price selection: prefer midpoint of bid/ask, then last trade, then outcomePrices
    let prob = null
    let priceSource = null

    if (bid != null && ask != null) {
      prob = (bid + ask) / 2
      priceSource = 'midpoint'
    } else if (last != null) {
      prob = last
      priceSource = 'lastTrade'
    } else if (outcomeYes != null) {
      prob = outcomeYes
      priceSource = 'outcomePrices'
    }

    if (prob === null) continue

    // Use event slug for URL (works for both standalone and group markets)
    const evts = m.events || []
    const eventSlug = evts.length > 0 ? (evts[0].slug || '') : ''
    const slug = eventSlug || m.slug || ''
    const url = slug ? `https://polymarket.com/event/${slug}` : null

    results.push({
      question: m.question,
      prob,
      priceSource,
      volume: m.volume ? parseFloat(m.volume) : 0,
      outcomes: outcomes,
      endDate: m.endDate || null,
      description: m.description || '',
      url,
      source: 'polymarket',
      _raw: {
        bid: rawBid,
        ask: rawAsk,
        last: rawLast,
        outcomeYes: rawOutcomeYes,
        yesIndex,
        outcomes: outcomes,
      },
    })
  }

  return results
}
