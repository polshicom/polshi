import { NextResponse } from 'next/server'
import { auth } from '../../../lib/auth'
import { cacheGet, cacheSet } from '../../../lib/cache'
import { fetchPolymarketMarkets } from '../../../lib/polymarket'
import { fetchKalshiMarkets } from '../../../lib/kalshi'
import { matchMarkets } from '../../../lib/matcher'
import { aiVerifyMatches } from '../../../lib/ai-verify'
import { sendDiscordAlert, formatMarketAlert } from '../../../lib/discord'

const CACHE_KEY = 'matched_markets_v2'
const FREE_MARKET_LIMIT = 5

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const confidence = searchParams.get('confidence') || 'all'
  const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
  const debug = searchParams.get('debug') === '1'

  // Check auth for tier gating (defense-in-depth)
  const session = await auth()
  const isPro = true // TODO: revert for production

  try {
    let markets = cacheGet(CACHE_KEY)

    if (!markets) {
      const [polymarkets, kalshiMarkets] = await Promise.all([
        fetchPolymarketMarkets().catch(() => []),
        fetchKalshiMarkets().catch(() => []),
      ])

      console.log(`[markets/route] Fetched ${polymarkets.length} Polymarket + ${kalshiMarkets.length} Kalshi markets`)

      // Step 1: Fingerprint-based matching (strict rules)
      markets = matchMarkets(polymarkets, kalshiMarkets)

      // Step 2: AI verification — secondary referee
      const aiResults = await aiVerifyMatches(markets).catch(() => null)
      if (aiResults) {
        markets = markets.map((m, i) => {
          const ai = aiResults.get(i)
          if (!ai) return m

          const aiConfidence = ai.aiConfidence

          // AI confidence thresholds:
          // >= 90 → verified (trusted)
          // 70-89 → possible match (warn user)
          // < 70  → reject
          const aiVerified = aiConfidence >= 90
          const aiPossible = aiConfidence >= 70 && aiConfidence < 90

          // Both rule-based AND AI must agree for full verification
          const verified = m.verified && aiVerified
          // isArbSafe only if fully verified by both layers
          const isArbSafe = verified && m.matchConfidence >= 85

          const edge = m.edge
          const totalCost = edge != null ? 100 - edge : null
          const buyPlatform = edge > 0
            ? (m.polymarket <= m.kalshi ? 'polymarket' : 'kalshi')
            : null

          return {
            ...m,
            verified,
            isArbSafe,
            edge,
            difference: edge,
            totalCost,
            buyPlatform,
            aiConfidence,
            aiReason: ai.aiReason,
            aiPossible: !verified && aiPossible && m.matchConfidence >= 80,
          }
        })

        // Re-sort: verified first (by edge desc), then possible, then unverified
        markets.sort((a, b) => {
          if (a.verified && !b.verified) return -1
          if (!a.verified && b.verified) return 1
          if (a.aiPossible && !b.aiPossible) return -1
          if (!a.aiPossible && b.aiPossible) return 1
          const aEdge = a.edge ?? -1
          const bEdge = b.edge ?? -1
          return bEdge - aEdge
        })
      }

      // Remove markets with 0¢ edge or edge > 15¢
      markets = markets.filter(m => m.edge != null && m.edge > 0 && m.edge <= 15)

      // Remove markets where AI confidence is below 70 (hard reject)
      markets = markets.filter(m => {
        if (m.aiConfidence == null) return true // AI didn't run
        return m.aiConfidence >= 70
      })

      cacheSet(CACHE_KEY, markets)

      // Fire-and-forget Discord alerts for verified high-edge matches
      const threshold = parseInt(process.env.DISCORD_ALERT_THRESHOLD || '5', 10)
      const alertMarkets = markets.filter(
        m => m.isArbSafe && m.difference >= threshold
      )
      if (alertMarkets.length > 0 && process.env.DISCORD_WEBHOOK_URL) {
        const msg = alertMarkets.map(formatMarketAlert).join('\n\n---\n\n')
        sendDiscordAlert(`🚨 **High-Spread Alert**\n\n${msg}`).catch(() => {})
      }
    }

    let filtered = markets
    if (confidence !== 'all') {
      const level = confidence.charAt(0).toUpperCase() + confidence.slice(1).toLowerCase()
      filtered = markets.filter(m => m.confidence === level)
    }

    const maxResults = isPro ? limit : Math.min(limit, FREE_MARKET_LIMIT)
    const result = filtered.slice(0, maxResults)

    // Strip internal fields before sending to client (unless debug mode)
    const cleaned = result.map(m => {
      const { _kalshiQuestion, _polyDescription, _kalshiDescription, _fingerprints, ...rest } = m

      if (debug) {
        // Include everything for debugging
        return {
          ...rest,
          _kalshiQuestion,
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

    return NextResponse.json({
      markets: cleaned,
      meta: {
        total: filtered.length,
        returned: cleaned.length,
        verified: markets.filter(m => m.verified).length,
        arbSafe: markets.filter(m => m.isArbSafe).length,
        possible: markets.filter(m => m.aiPossible).length,
        highConfidence: markets.filter(m => m.confidence === 'High').length,
        lastUpdated: new Date().toISOString(),
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
