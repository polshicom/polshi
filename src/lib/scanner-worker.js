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
import { matchMarkets, categorize } from './matcher.js'
import { aiVerifyMatches } from './ai-verify.js'
import { sendDiscordAlert, formatMarketAlert } from './discord.js'
import { fetchAllTrades } from './trades.js'

const CACHE_KEY = 'matched_markets_v2'
const TOP_ARB_KEY = 'top_arb_of_day'
const EXPLORE_KEY = 'explore_markets'
const STATS_KEY = 'scanner_stats'
const WHALE_YESTERDAY_KEY = 'whale_yesterday'
const WHALE_TRADES_KEY = 'whale_trades'
const CACHE_TTL = 120_000 // 2 minutes (worker refreshes every 30s, so data is always fresh)
const TOP_ARB_TTL = 900_000 // 15 minutes (long-lived, updated every cycle)
const EXPLORE_TTL = 120_000 // 2 minutes (same as scanner cache)
const STATS_TTL = 120_000 // 2 minutes
const WHALE_YESTERDAY_TTL = 300_000 // 5 minutes
const WHALE_TRADES_TTL = 60_000 // 60 seconds
const REFRESH_INTERVAL = 30_000 // 30 seconds

function formatVolume(vol) {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

function parseVolume(volStr) {
  if (typeof volStr === 'number') return volStr
  if (!volStr || typeof volStr !== 'string') return 0
  const cleaned = volStr.replace(/[$,]/g, '')
  if (cleaned.endsWith('M')) return parseFloat(cleaned) * 1_000_000
  if (cleaned.endsWith('K')) return parseFloat(cleaned) * 1_000
  if (cleaned.endsWith('B')) return parseFloat(cleaned) * 1_000_000_000
  return parseFloat(cleaned) || 0
}

let workerRunning = false
let intervalHandle = null
let lastRunMs = 0
let lastRunTimings = null
let consecutiveErrors = 0
let firstCyclePromise = null

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

    // ── Explore cache (raw combined market list for explore/hub/volume) ──
    const exploreMarkets = []
    for (const m of polymarkets) {
      exploreMarkets.push({
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
      exploreMarkets.push({
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
    exploreMarkets.sort((a, b) => b.volume - a.volume)
    cacheSet(EXPLORE_KEY, exploreMarkets, EXPLORE_TTL)

    // ── Whale trades (full list + whale of the day) ──
    fetchAllTrades()
      .then(trades => {
        cacheSet(WHALE_TRADES_KEY, trades, WHALE_TRADES_TTL)
        if (trades.length > 0) {
          const top = trades.reduce((best, t) => t.dollarValue > best.dollarValue ? t : best, trades[0])
          cacheSet(WHALE_YESTERDAY_KEY, top, WHALE_YESTERDAY_TTL)
        }
      })
      .catch(err => console.error('[scanner-worker] Whale trades error:', err.message))

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

    // ── Scanner stats (lightweight summary for StatusBar) ──
    const safeArbs = markets.filter(m => m.isArbSafe && m.edge > 0)
    let totalEdge = 0
    for (const m of safeArbs) {
      totalEdge += (m.edge / 100) * parseVolume(m.volume)
    }
    cacheSet(STATS_KEY, {
      scanned: exploreMarkets.length,
      arbCount: safeArbs.length,
      totalEdge,
    }, STATS_TTL)

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

  // Run first cycle immediately, store promise so API routes can await it
  firstCyclePromise = runCycle()

  // Then repeat on interval
  intervalHandle = setInterval(runCycle, REFRESH_INTERVAL)

  // Prevent interval from keeping Node alive during graceful shutdown
  if (intervalHandle?.unref) intervalHandle.unref()
}

/**
 * Waits for the first worker cycle to complete (cold-start).
 * Returns immediately if the worker has already completed a cycle.
 */
export async function waitForFirstCycle() {
  if (firstCyclePromise) await firstCyclePromise
}

/**
 * Returns the cache key used by the worker (for the API route).
 */
export { CACHE_KEY, TOP_ARB_KEY, EXPLORE_KEY, STATS_KEY, WHALE_YESTERDAY_KEY, WHALE_TRADES_KEY }
