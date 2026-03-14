import { NextResponse } from 'next/server'
import { cacheGetWithMeta } from '../../../lib/cache'
import { ensureWorkerRunning, waitForFirstCycle, CACHE_KEY } from '../../../lib/scanner-worker'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'all'
  const query = (searchParams.get('q') || '').toLowerCase()
  const sortBy = searchParams.get('sort') || 'default'
  const limit = Math.min(parseInt(searchParams.get('limit') || '300', 10), 500)

  ensureWorkerRunning()
  await waitForFirstCycle()

  try {
    const cached = cacheGetWithMeta(CACHE_KEY)
    const matches = cached.value || []

    let filtered = matches

    if (category !== 'all') {
      filtered = filtered.filter(m => m.category === category)
    }

    if (query) {
      filtered = filtered.filter(m => m.question.toLowerCase().includes(query))
    }

    if (sortBy === 'edge') {
      filtered = [...filtered].sort((a, b) => (b.edge || 0) - (a.edge || 0))
    } else if (sortBy === 'endDate') {
      filtered = [...filtered].sort((a, b) => {
        const aT = a.endDate ? new Date(a.endDate).getTime() : Infinity
        const bT = b.endDate ? new Date(b.endDate).getTime() : Infinity
        return aT - bT
      })
    }
    // default: preserved from cache (verified first, then by edge desc)

    const result = filtered.slice(0, limit)
    const categories = [...new Set(matches.map(m => m.category))].sort()

    return NextResponse.json({
      markets: result,
      meta: {
        total: filtered.length,
        returned: result.length,
        categories,
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
