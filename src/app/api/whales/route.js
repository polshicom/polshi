import { NextResponse } from 'next/server'
import { cacheGet, cacheSet } from '../../../lib/cache'
import { fetchAllTrades } from '../../../lib/trades'

const CACHE_KEY = 'whale_trades'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform') || 'all'
  const minSize = parseInt(searchParams.get('minSize') || '0', 10)

  try {
    let trades = cacheGet(CACHE_KEY)

    if (!trades) {
      trades = await fetchAllTrades()
      cacheSet(CACHE_KEY, trades, 30_000)
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
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch trades', trades: [], meta: { total: 0 } },
      { status: 500 }
    )
  }
}
