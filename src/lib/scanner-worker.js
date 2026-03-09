/**
 * Background scanner worker.
 *
 * Precomputes market comparisons on a 30-second interval and stores
 * the fully processed results in cache. The API route serves from
 * cache immediately — users never wait on fetch/match/verify.
 */

import { cacheSet, cacheGetWithMeta } from './cache.js'
import { fetchPolymarketMarkets } from './polymarket.js'
import { fetchKalshiMarkets } from './kalshi.js'
import { matchMarkets } from './matcher.js'
import { aiVerifyMatches } from './ai-verify.js'
import { sendDiscordAlert, formatMarketAlert } from './discord.js'

const CACHE_KEY = 'matched_markets_v2'
const TOP_ARB_KEY = 'top_arb_of_day'
const CACHE_TTL = 120_000 // 2 minutes (worker refreshes every 30s, so data is always fresh)
const TOP_ARB_TTL = 900_000 // 15 minutes (long-lived, updated every cycle)
const REFRESH_INTERVAL = 30_000 // 30 seconds

let workerRunning = false
let intervalHandle = null
let lastRunMs = 0
let lastRunTimings = null
let consecutiveErrors = 0

/**
 * Returns timing data from the last worker run (for diagnostics).
 */
export function getLastTimings() {
  return lastRunTimings
}

/**
 * Single computation cycle: fetch → match → verify → cache.
 * Never throws — errors are caught and logged.
 */
async function runCycle() {
  const t0 = Date.now()
  const timings = { fetchMs: 0, matchMs: 0, verifyMs: 0, postProcessMs: 0, totalMs: 0 }

  try {
    // ── Fetch ────────────────────────────────────────
    const tFetch = Date.now()
    const [polymarkets, kalshiMarkets] = await Promise.all([
      fetchPolymarketMarkets().catch((err) => {
        console.error('[scanner-worker] Polymarket fetch error:', err.message)
        return []
      }),
      fetchKalshiMarkets().catch((err) => {
        console.error('[scanner-worker] Kalshi fetch error:', err.message)
        return []
      }),
    ])
    timings.fetchMs = Date.now() - tFetch

    if (polymarkets.length === 0 && kalshiMarkets.length === 0) {
      console.warn('[scanner-worker] Both APIs returned empty — skipping cycle')
      return
    }

    console.log(`[scanner-worker] Fetched ${polymarkets.length} Polymarket + ${kalshiMarkets.length} Kalshi markets (${timings.fetchMs}ms)`)

    // ── Match ────────────────────────────────────────
    const tMatch = Date.now()
    let markets = matchMarkets(polymarkets, kalshiMarkets)
    timings.matchMs = Date.now() - tMatch

    console.log(`[scanner-worker] Matched ${markets.length} pairs (${timings.matchMs}ms)`)

    // ── AI Verify (non-blocking — runs here in background, never on user request) ──
    const tVerify = Date.now()
    const aiResults = await aiVerifyMatches(markets).catch((err) => {
      console.error('[scanner-worker] AI verify error:', err.message)
      return null
    })
    timings.verifyMs = Date.now() - tVerify

    // ── Post-process ─────────────────────────────────
    const tPost = Date.now()

    if (aiResults) {
      markets = markets.map((m, i) => {
        const ai = aiResults.get(i)
        if (!ai) return m

        const aiConfidence = ai.aiConfidence
        const aiVerified = aiConfidence >= 90
        const aiPossible = aiConfidence >= 70 && aiConfidence < 90

        const verified = m.verified && aiVerified
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

      // Sort: verified first, then possible, then unverified, by edge desc
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

    // Filter: remove 0¢ edge, >15¢ edge, and AI < 70
    markets = markets.filter(m => m.edge != null && m.edge > 0 && m.edge <= 15)
    markets = markets.filter(m => {
      if (m.aiConfidence == null) return true
      return m.aiConfidence >= 70
    })

    // Strip heavy debug/raw fields before caching — reduce memory + payload
    markets = markets.map(m => {
      const { debug, ...rest } = m
      return rest
    })

    timings.postProcessMs = Date.now() - tPost
    timings.totalMs = Date.now() - t0

    // ── Cache ────────────────────────────────────────
    cacheSet(CACHE_KEY, markets, CACHE_TTL)

    // ── Top Arb of the Day (separate lightweight cache) ──
    const bestArb = markets.find(m => m.isArbSafe && m.edge > 0)
    if (bestArb) {
      cacheSet(TOP_ARB_KEY, {
        question: bestArb.question,
        polymarket: bestArb.polymarket,
        kalshi: bestArb.kalshi,
        edge: bestArb.edge,
        difference: bestArb.difference,
        totalCost: bestArb.totalCost,
        buyPlatform: bestArb.buyPlatform,
        volume: bestArb.volume,
        aiConfidence: bestArb.aiConfidence,
        polymarketUrl: bestArb.polymarketUrl,
        kalshiUrl: bestArb.kalshiUrl,
        endDate: bestArb.endDate,
        category: bestArb.category,
      }, TOP_ARB_TTL)
    } else {
      cacheSet(TOP_ARB_KEY, null, TOP_ARB_TTL)
    }

    lastRunMs = Date.now()
    lastRunTimings = timings
    consecutiveErrors = 0

    console.log(
      `[scanner-worker] Cycle complete: ${markets.length} results cached ` +
      `(fetch=${timings.fetchMs}ms match=${timings.matchMs}ms verify=${timings.verifyMs}ms total=${timings.totalMs}ms)`
    )

    // ── Discord alerts (fire-and-forget) ─────────────
    const threshold = parseInt(process.env.DISCORD_ALERT_THRESHOLD || '5', 10)
    const alertMarkets = markets.filter(m => m.isArbSafe && m.difference >= threshold)
    if (alertMarkets.length > 0 && process.env.DISCORD_WEBHOOK_URL) {
      const msg = alertMarkets.map(formatMarketAlert).join('\n\n---\n\n')
      sendDiscordAlert(`🚨 **High-Spread Alert**\n\n${msg}`).catch(() => {})
    }
  } catch (err) {
    consecutiveErrors++
    timings.totalMs = Date.now() - t0
    lastRunTimings = timings
    console.error(`[scanner-worker] Cycle failed (attempt ${consecutiveErrors}):`, err.message)
  }
}

/**
 * Ensures the background worker is running.
 * Safe to call multiple times — only starts once.
 */
export function ensureWorkerRunning() {
  if (workerRunning) return
  workerRunning = true

  console.log('[scanner-worker] Starting background worker (30s interval)')

  // Run first cycle immediately
  runCycle()

  // Then repeat on interval
  intervalHandle = setInterval(runCycle, REFRESH_INTERVAL)

  // Prevent interval from keeping Node alive during graceful shutdown
  if (intervalHandle?.unref) intervalHandle.unref()
}

/**
 * Returns the cache key used by the worker (for the API route).
 */
export { CACHE_KEY, TOP_ARB_KEY }
