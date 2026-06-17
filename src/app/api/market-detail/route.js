import { NextResponse } from 'next/server'
import { cacheGetWithMeta } from '../../../lib/cache'
import { ensureWorkerRunning, waitForFirstCycle, WHALE_TRADES_KEY } from '../../../lib/scanner-worker'

// Same cache key used by /api/markets
const CACHE_KEY = 'matched_markets_v2'

function normalize(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '')
}

// Score how well a whale trade matches a market question
function tradeMatchScore(tradeMarket, question) {
  if (!tradeMarket || !question) return 0
  const tNorm = normalize(tradeMarket)
  const qNorm = normalize(question)

  // Exact normalized match
  if (tNorm === qNorm) return 100

  // Check word overlap
  const qWords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  const tWords = tradeMarket.toLowerCase().split(/\s+/).filter(w => w.length > 3)
  if (qWords.length === 0) return 0
  const matches = qWords.filter(w => tWords.includes(w)).length
  return Math.round((matches / qWords.length) * 100)
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 })
  }

  ensureWorkerRunning()
  await waitForFirstCycle()

  const cached = cacheGetWithMeta(CACHE_KEY)
  const markets = cached.value || []

  // Find market by matching slug to normalized question
  const slugNorm = normalize(slug.replace(/-/g, ''))
  const market = markets.find(m => normalize(m.question.slice(0, 100).replace(/\s+/g, '')) === slugNorm)
    ?? markets.find(m => {
      // Fallback: slug-based partial match
      const mSlug = m.question.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 100)
      return mSlug === slug
    })

  if (!market) {
    return NextResponse.json({ error: 'Market not found' }, { status: 404 })
  }

  // Get whale trades relevant to this market
  const whaleCached = cacheGetWithMeta(WHALE_TRADES_KEY)
  const allTrades = whaleCached.value || []
  const relatedTrades = allTrades
    .map(t => ({ ...t, _score: tradeMatchScore(t.market, market.question) }))
    .filter(t => t._score >= 40)
    .sort((a, b) => b._score - a._score || b.dollarValue - a.dollarValue)
    .slice(0, 5)
    .map(({ _score, ...t }) => t)

  return NextResponse.json({
    market,
    relatedTrades,
    meta: { lastUpdated: cached.timestamp ? new Date(cached.timestamp).toISOString() : null },
  })
}
