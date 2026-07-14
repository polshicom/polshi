const POLYMARKET_TRADES_URL = 'https://data-api.polymarket.com/trades'
const KALSHI_TRADES_URL = 'https://api.elections.kalshi.com/trade-api/v2/markets/trades'

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// Make Kalshi tickers human-readable
function formatKalshiTicker(ticker) {
  if (!ticker) return 'Unknown'
  let clean = ticker.replace(/^KX/, '')
  const parts = clean.split('-')
  if (parts.length >= 2) {
    const eventPart = parts[0]
    const eventName = eventPart
      .replace(/GAME$/, ' Game')
      .replace(/MATCH$/, ' Match')
      .replace(/GOLD$/, ' Gold')
      .replace(/^LEADERNBA/, 'NBA Leader: ')
      .replace(/^WOHOCKEY/, 'Hockey')
      .replace(/^LIGAMX/, 'Liga MX')
    const outcome = parts[parts.length - 1]
    return `${eventName} - ${outcome}`
  }
  return clean
}

function formatDollar(val) {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}K`
  return `$${val.toFixed(0)}`
}

export async function fetchPolymarketTrades() {
  const res = await fetch(`${POLYMARKET_TRADES_URL}?limit=100`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Polymarket trades API error: ${res.status}`)

  const data = await res.json()
  if (!Array.isArray(data)) return []

  return data.map(t => {
    const size = parseFloat(t.size) || 0
    const price = parseFloat(t.price) || 0
    const dollarValue = size * price
    const ts = new Date((t.timestamp || 0) * 1000)

    return {
      time: ts.toISOString(),
      timeAgo: timeAgo(ts),
      platform: 'polymarket',
      market: t.title || 'Unknown',
      slug: t.slug || null,
      side: t.side === 'BUY' ? 'BUY' : 'SELL',
      outcome: t.outcome || 'Yes',
      price: Math.round(price * 100),
      contracts: Math.round(size),
      dollarValue,
      dollarFormatted: formatDollar(dollarValue),
      url: t.eventSlug ? `https://polymarket.com/event/${t.eventSlug}` : null,
      trader: t.name || t.pseudonym || null,
      wallet: t.proxyWallet || null,
    }
  })
}

export async function fetchKalshiTrades() {
  const res = await fetch(`${KALSHI_TRADES_URL}?limit=100`, {
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Kalshi trades API error: ${res.status}`)

  const data = await res.json()
  const trades = data.trades || []

  return trades.map(t => {
    const count = t.count || 0
    const yesPrice = parseFloat(t.yes_price_dollars) || 0
    const noPrice = parseFloat(t.no_price_dollars) || 0
    const isYes = t.taker_side === 'yes'
    const dollarValue = count * (isYes ? yesPrice : noPrice)
    const displayPrice = isYes ? t.yes_price : t.no_price
    const ts = new Date(t.created_time)

    const ticker = t.ticker || ''
    const tickerBase = ticker.replace(/-\d+.*$/, '').toLowerCase()
    const readable = formatKalshiTicker(ticker)

    return {
      time: ts.toISOString(),
      timeAgo: timeAgo(ts),
      platform: 'kalshi',
      market: readable,
      slug: ticker,
      side: isYes ? 'YES' : 'NO',
      outcome: isYes ? 'Yes' : 'No',
      price: displayPrice || 0,
      contracts: count,
      dollarValue,
      dollarFormatted: formatDollar(dollarValue),
      url: tickerBase ? `https://kalshi.com/markets/${tickerBase}` : null,
      trader: null,
      wallet: null,
    }
  })
}

// Compute whale score: how significant is this trade relative to typical
// trade sizes in the batch? Score 0-100.
function computeWhaleScores(trades) {
  if (trades.length === 0) return trades

  // Calculate median dollar value for normalization
  const values = trades.map(t => t.dollarValue).filter(v => v > 0).sort((a, b) => a - b)
  if (values.length === 0) return trades

  const median = values[Math.floor(values.length / 2)]
  const p90 = values[Math.floor(values.length * 0.9)]
  const p99 = values[Math.floor(values.length * 0.99)]

  return trades.map(t => {
    let whaleScore = 0
    if (median > 0) {
      const ratio = t.dollarValue / median
      // Score based on how many multiples of median
      if (ratio >= 100) whaleScore = 100
      else if (ratio >= 50) whaleScore = 90
      else if (ratio >= 20) whaleScore = 80
      else if (ratio >= 10) whaleScore = 70
      else if (ratio >= 5) whaleScore = 60
      else if (ratio >= 2) whaleScore = 40
      else if (ratio >= 1) whaleScore = 20
      else whaleScore = Math.round(ratio * 20)
    }

    let whaleLabel = null
    if (whaleScore >= 90) whaleLabel = 'Mega Whale'
    else if (whaleScore >= 70) whaleLabel = 'Whale'
    else if (whaleScore >= 50) whaleLabel = 'Big Fish'
    else if (whaleScore >= 30) whaleLabel = 'Notable'

    return { ...t, whaleScore, whaleLabel }
  })
}

// Group trades by wallet (Polymarket only) to identify repeat whales
function identifyRepeatWhales(trades) {
  const walletMap = new Map()

  for (const t of trades) {
    if (!t.wallet) continue
    if (!walletMap.has(t.wallet)) {
      walletMap.set(t.wallet, { count: 0, totalValue: 0, name: t.trader })
    }
    const w = walletMap.get(t.wallet)
    w.count++
    w.totalValue += t.dollarValue
    if (t.trader && !w.name) w.name = t.trader
  }

  return trades.map(t => {
    if (!t.wallet || !walletMap.has(t.wallet)) return t
    const w = walletMap.get(t.wallet)
    return {
      ...t,
      walletTradeCount: w.count,
      walletTotalValue: w.totalValue,
      walletTotalFormatted: formatDollar(w.totalValue),
      isRepeatWhale: w.count >= 3 || w.totalValue >= 5_000,
    }
  })
}

export async function fetchAllTrades() {
  const [polyTrades, kalshiTrades] = await Promise.all([
    fetchPolymarketTrades().catch(() => []),
    fetchKalshiTrades().catch(() => []),
  ])

  let all = [...polyTrades, ...kalshiTrades]
  // Sort by time descending (newest first)
  all.sort((a, b) => new Date(b.time) - new Date(a.time))
  // Add whale scores
  all = computeWhaleScores(all)
  // Identify repeat whales
  all = identifyRepeatWhales(all)
  return all
}
