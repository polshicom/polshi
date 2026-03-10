import { NextResponse } from 'next/server'
import { cacheGetWithMeta, cacheSet } from '../../../lib/cache'
import { fetchAllTrades } from '../../../lib/trades'

const CACHE_KEY = 'whale_trades'
const CACHE_TTL = 60_000 // 60 seconds

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform') || 'all'
  const minSize = parseInt(searchParams.get('minSize') || '0', 10)

  try {
    const cached = cacheGetWithMeta(CACHE_KEY)
    let trades = cached.value

    if (!trades) {
      // Cold start or cache fully expired — fetch and cache
      trades = await fetchAllTrades()
      cacheSet(CACHE_KEY, trades, CACHE_TTL)
    } else if (cached.stale) {
      // Serve stale data immediately, refresh in background
      fetchAllTrades()
        .then(fresh => cacheSet(CACHE_KEY, fresh, CACHE_TTL))
        .catch(() => {})
    }

    let filtered = trades

    if (platform !== 'all') {
      filtered = filtered.filter(t => t.platform === platform)
    }

    if (minSize > 0) {
      filtered = filtered.filter(t => t.dollarValue >= minSize)
    }

    return NextResponse.json({
      trades: filtered,
      meta: {
        total: filtered.length,
        lastUpdated: cached.timestamp ? new Date(cached.timestamp).toISOString() : new Date().toISOString(),
        cacheAgeMs: cached.age !== Infinity ? Math.round(cached.age) : null,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch trades', trades: [], meta: { total: 0 } },
      { status: 500 }
    )
  }
}
