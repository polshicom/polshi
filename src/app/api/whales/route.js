import { NextResponse } from 'next/server'
import { cacheGetWithMeta } from '../../../lib/cache'
import { ensureWorkerRunning, waitForFirstCycle, WHALE_TRADES_KEY } from '../../../lib/scanner-worker'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform') || 'all'
  const minSize = parseInt(searchParams.get('minSize') || '0', 10)

  ensureWorkerRunning()
  await waitForFirstCycle()

  try {
    const cached = cacheGetWithMeta(WHALE_TRADES_KEY)
    const trades = cached.value || []

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
