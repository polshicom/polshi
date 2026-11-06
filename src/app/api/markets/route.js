import { NextResponse } from 'next/server'
import { auth } from '../../../lib/auth'
import { cacheGetWithMeta } from '../../../lib/cache'
import { ensureWorkerRunning, CACHE_KEY, getLastTimings, isWarming, ARB_MIN_EDGE, ARB_MIN_CONFIDENCE } from '../../../lib/scanner-worker'

const FREE_MARKET_LIMIT = 5

export async function GET(request) {
  const t0 = Date.now()
  const { searchParams } = new URL(request.url)
  const confidence = searchParams.get('confidence') || 'all'
  const limit = Math.min(parseInt(searchParams.get('limit') || '200', 10), 500)
  const offset = parseInt(searchParams.get('offset') || '0', 10)
  const debug = searchParams.get('debug') === '1'

  // Auth for tier gating
  const session = await auth()
  const isPro = session?.user?.isPro || false

  // Start background worker — never block the response
  ensureWorkerRunning()

  try {
    const cached = await cacheGetWithMeta(CACHE_KEY)
    const allMatches = cached.value || []
    const cacheAgeMs = cached.age
    const cacheTimestamp = cached.timestamp
    const isStale = cached.stale

    // This route feeds the arbitrage scanner, not the full "matched
    // markets" list — most matches have no meaningful price gap, so
    // only show ones that are actually worth trading (real edge +
    // enough confidence that it's genuinely the same event).
    const markets = allMatches.filter(m => m.edge >= ARB_MIN_EDGE && m.matchConfidence >= ARB_MIN_CONFIDENCE)

    // Filter by confidence
    let filtered = markets
    if (confidence !== 'all') {
      const level = confidence.charAt(0).toUpperCase() + confidence.slice(1).toLowerCase()
      filtered = markets.filter(m => m.confidence === level)
    }

    // Tier gating
    const maxResults = isPro ? limit : Math.min(limit, FREE_MARKET_LIMIT)

    // Pagination
    const paged = filtered.slice(offset, offset + maxResults)

    // Strip internal fields before sending to client
    const cleaned = paged.map(m => {
      const { _polyDescription, _kalshiDescription, _fingerprints, ...rest } = m

      if (debug) {
        return {
          ...rest,
          _debug: {
            fingerprints: _fingerprints,
            matchConfidence: m.matchConfidence,
            matchReason: m.matchReason,
            aiConfidence: m.aiConfidence,
            aiReason: m.aiReason,
            isArbSafe: m.isArbSafe,
            aiPossible: m.aiPossible,
          },
        }
      }

      return rest
    })

    const timings = getLastTimings()
    const responseTimeMs = Date.now() - t0

    if (debug) {
      console.log(`[markets/route] Served ${cleaned.length} results in ${responseTimeMs}ms (cache age: ${Math.round(cacheAgeMs / 1000)}s)`)
    }

    return NextResponse.json({
      markets: cleaned,
      meta: {
        total: filtered.length,
        returned: cleaned.length,
        offset,
        hasMore: offset + maxResults < filtered.length,
        verified: markets.filter(m => m.verified).length,
        arbSafe: markets.filter(m => m.isArbSafe).length,
        possible: markets.filter(m => m.aiPossible).length,
        highConfidence: markets.filter(m => m.confidence === 'High').length,
        lastUpdated: cacheTimestamp ? new Date(cacheTimestamp).toISOString() : null,
        cacheAgeMs: Math.round(cacheAgeMs),
        isStale,
        warming: isWarming(),
        responseMs: responseTimeMs,
        workerTimings: debug ? timings : undefined,
      },
    })
  } catch (error) {
    console.error('[markets/route] Error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch markets', markets: [], meta: { total: 0, verified: 0, arbSafe: 0, lastUpdated: null } },
      { status: 500 }
    )
  }
}
