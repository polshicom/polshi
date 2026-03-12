import { NextResponse } from 'next/server'
import { cacheGetWithMeta } from '../../../lib/cache'
import { ensureWorkerRunning, waitForFirstCycle, EXPLORE_KEY } from '../../../lib/scanner-worker'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform') || 'all'
  const category = searchParams.get('category') || 'all'
  const query = (searchParams.get('q') || '').toLowerCase()
  const sortBy = searchParams.get('sort') || 'volume'
  const limit = Math.min(parseInt(searchParams.get('limit') || '300', 10), 500)

  // Ensure background worker is running and has data
  ensureWorkerRunning()
  await waitForFirstCycle()

  try {
    // Serve from worker cache — no external API calls
    const cached = cacheGetWithMeta(EXPLORE_KEY)
    const markets = cached.value || []

    // Compute platform-level totals from ALL markets before filtering
    const allPoly = markets.filter(m => m.platform === 'polymarket')
    const allKalshi = markets.filter(m => m.platform === 'kalshi')
    const platformTotals = {
      polymarket: {
        count: allPoly.length,
        volume: allPoly.reduce((s, m) => s + (m.volume || 0), 0),
        liquidity: allPoly.reduce((s, m) => s + (m.liquidity || 0), 0),
        volume24hr: allPoly.reduce((s, m) => s + (m.volume24hr || 0), 0),
      },
      kalshi: {
        count: allKalshi.length,
        volume: allKalshi.reduce((s, m) => s + (m.volume || 0), 0),
        openInterest: allKalshi.reduce((s, m) => s + (m.openInterest || 0), 0),
        volume24h: allKalshi.reduce((s, m) => s + (m.volume24h || 0), 0),
      },
    }

    let filtered = markets

    if (platform !== 'all') {
      filtered = filtered.filter(m => m.platform === platform)
    }

    if (category !== 'all') {
      filtered = filtered.filter(m => m.category === category)
    }

    if (query) {
      filtered = filtered.filter(m => m.question.toLowerCase().includes(query))
    }

    // Sort
    if (sortBy === 'prob') {
      filtered = [...filtered].sort((a, b) => b.prob - a.prob)
    } else if (sortBy === 'endDate') {
      filtered = [...filtered].sort((a, b) => {
        const aT = a.endDate ? new Date(a.endDate).getTime() : Infinity
        const bT = b.endDate ? new Date(b.endDate).getTime() : Infinity
        return aT - bT
      })
    }
    // volume is default sort from cache

    const result = filtered.slice(0, limit)

    // Get unique categories for the filter dropdown
    const categories = [...new Set(markets.map(m => m.category))].sort()

    return NextResponse.json({
      markets: result,
      meta: {
        total: filtered.length,
        returned: result.length,
        categories,
        platformTotals,
        lastUpdated: cached.timestamp ? new Date(cached.timestamp).toISOString() : new Date().toISOString(),
        cacheAgeMs: Math.round(cached.age),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch markets', markets: [], meta: { total: 0, categories: [] } },
      { status: 500 }
    )
  }
}
