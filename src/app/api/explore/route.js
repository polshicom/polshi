import { NextResponse } from 'next/server'
import { cacheGet, cacheSet } from '../../../lib/cache'
import { fetchPolymarketMarkets } from '../../../lib/polymarket'
import { fetchKalshiMarkets } from '../../../lib/kalshi'
import { categorize } from '../../../lib/matcher'

const CACHE_KEY = 'all_markets'

function formatVolume(vol) {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform') || 'all'
  const category = searchParams.get('category') || 'all'
  const query = (searchParams.get('q') || '').toLowerCase()
  const sortBy = searchParams.get('sort') || 'volume'
  const limit = Math.min(parseInt(searchParams.get('limit') || '300', 10), 500)

  try {
    let markets = cacheGet(CACHE_KEY)

    if (!markets) {
      const [polymarkets, kalshiMarkets] = await Promise.all([
        fetchPolymarketMarkets().catch(() => []),
        fetchKalshiMarkets().catch(() => []),
      ])

      markets = []

      for (const m of polymarkets) {
        markets.push({
          question: m.question,
          prob: Math.round(m.prob * 100),
          volume: m.volume || 0,
          liquidity: m.liquidity || 0,
          volume24hr: m.volume24hr || 0,
          volumeFormatted: formatVolume(m.volume || 0),
          category: categorize(m.question),
          platform: 'polymarket',
          endDate: m.endDate || null,
          url: m.url || null,
          description: m.description || '',
        })
      }

      for (const m of kalshiMarkets) {
        markets.push({
          question: m.question,
          prob: Math.round(m.prob * 100),
          volume: m.volume || 0,
          openInterest: m.openInterest || 0,
          volume24h: m.volume24h || 0,
          volumeFormatted: formatVolume(m.volume || 0),
          category: categorize(m.question),
          platform: 'kalshi',
          endDate: m.endDate || null,
          url: m.url || null,
          description: m.description || '',
        })
      }

      // Default sort by volume desc
      markets.sort((a, b) => b.volume - a.volume)

      cacheSet(CACHE_KEY, markets, 30_000)
    }

    // Compute platform-level totals from ALL markets before filtering/limiting.
    // This ensures the dominance view gets accurate numbers.
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
        lastUpdated: new Date().toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch markets', markets: [], meta: { total: 0, categories: [] } },
      { status: 500 }
    )
  }
}
