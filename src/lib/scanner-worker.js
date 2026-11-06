/**
 * Background scanner worker.
 *
 * Precomputes market comparisons on a 30-second interval and stores
 * the fully processed results in cache. The API route serves from
 * cache immediately — users never wait on fetch/match/verify.
 *
 * Production pipeline: Fetch → matchMarkets → aiVerifyMatches → Cache
 * Shadow pipeline (async, non-blocking): Fetch → blocker → GPT-4o mini → compare
 */

import { cacheSet, cacheGet, cacheGetWithMeta } from './cache.js'
import { fetchPolymarketMarkets } from './polymarket.js'
import { fetchKalshiMarkets } from './kalshi.js'
import { matchMarkets, categorize, getLastMatchStats } from './matcher.js'
import { aiVerifyMatches } from './ai-verify.js'
import { sendDiscordAlert, formatMarketAlert } from './discord.js'
import { fetchAllTrades } from './trades.js'
import { compareAndRecord, getComparisonReport } from './pipeline-compare.js'

const CACHE_KEY = 'matched_markets_v2'
const TOP_ARB_KEY = 'top_arb_of_day'
const EXPLORE_KEY = 'explore_markets'
const STATS_KEY = 'scanner_stats'
const WHALE_YESTERDAY_KEY = 'whale_yesterday'
const WHALE_TRADES_KEY = 'whale_trades'
const COMPARE_KEY = 'pipeline_comparison'
const SHADOW_LAST_RUN_KEY = 'shadow_pipeline_last_run'
const DEBUG_KEY = 'last_cycle_debug'
const CACHE_TTL = 120_000
const TOP_ARB_TTL = 900_000
const EXPLORE_TTL = 120_000
const STATS_TTL = 120_000
const WHALE_YESTERDAY_TTL = 300_000
const WHALE_TRADES_TTL = 60_000
const COMPARE_TTL = 300_000
const REFRESH_INTERVAL = 30_000
const SHADOW_PIPELINE_INTERVAL = 20 * 60_000 // run the GPT shadow comparison at most every 20 minutes

// A "match" and an "arb opportunity" are different things — most matches
// will have near-identical pricing with nothing worth trading. These
// thresholds define what counts as a real, tradeable arb: both a
// meaningful price gap and confidence that it's actually the same event.
const ARB_MIN_EDGE = 2
const ARB_MIN_CONFIDENCE = 45

function formatVolume(vol) {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

// Persists progress mid-cycle so a crash that bypasses our own error
// handling (process-level kill, not a catchable JS exception) still
// leaves a breadcrumb showing exactly which stage it reached.
async function checkpoint(stage, extra = {}) {
  try {
    await cacheSet(DEBUG_KEY, { stage, at: new Date().toISOString(), ...extra }, CACHE_TTL)
  } catch {}
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
let firstCycleComplete = false
let lastCycleDebug = null

export function getLastTimings() {
  return lastRunTimings
}

export function getLastDebug() {
  return lastCycleDebug
}

export function isWarming() {
  return workerRunning && !firstCycleComplete
}

let cycleInFlight = false

async function runCycle() {
  // Full market coverage means a cycle can occasionally run long —
  // skip overlapping runs rather than racing two cycles on the same cache keys.
  if (cycleInFlight) {
    console.warn('[scanner-worker] Previous cycle still running — skipping this tick')
    return
  }
  cycleInFlight = true

  const t0 = Date.now()
  const timings = { fetchMs: 0, matchMs: 0, verifyMs: 0, postProcessMs: 0, totalMs: 0 }

  let polyFetchError = null
  let kalshiFetchError = null

  try {
    // ── Fetch ────────────────────────────────────────
    const tFetch = Date.now()
    const [polymarkets, kalshiMarkets] = await Promise.all([
      fetchPolymarketMarkets().catch((err) => {
        console.error('[scanner-worker] Polymarket fetch error:', err.message)
        polyFetchError = err.message
        return []
      }),
      fetchKalshiMarkets().catch((err) => {
        console.error('[scanner-worker] Kalshi fetch error:', err.message)
        kalshiFetchError = err.message
        return []
      }),
    ])
    timings.fetchMs = Date.now() - tFetch

    if (polymarkets.length === 0 && kalshiMarkets.length === 0) {
      console.warn('[scanner-worker] Both APIs returned empty — skipping cycle')
      lastCycleDebug = { polyCount: 0, kalshiCount: 0, polyFetchError, kalshiFetchError, skipped: 'both empty' }
      return
    }

    console.log(`[scanner-worker] Fetched ${polymarkets.length} Polymarket + ${kalshiMarkets.length} Kalshi markets (${timings.fetchMs}ms)`)
    await checkpoint('fetch_complete', { polyCount: polymarkets.length, kalshiCount: kalshiMarkets.length, fetchMs: timings.fetchMs })

    // ── Explore cache ──
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
    await cacheSet(EXPLORE_KEY, exploreMarkets, EXPLORE_TTL)
    await checkpoint('explore_cache_complete', { exploreCount: exploreMarkets.length })

    // Diagnostic: category distribution per platform. The matcher only
    // ever scores pairs within the same category bucket (plus a limited
    // cross-category fallback for "Other"), so if the two platforms'
    // independent categorize() calls disagree systematically on the same
    // real-world events, that alone could be silently capping match
    // count — no amount of scoring-signal tuning fixes a pair that's
    // never compared in the first place.
    const categoryBreakdown = {}
    for (const m of exploreMarkets) {
      if (!categoryBreakdown[m.category]) categoryBreakdown[m.category] = { poly: 0, kalshi: 0 }
      categoryBreakdown[m.category][m.platform === 'polymarket' ? 'poly' : 'kalshi']++
    }

    // ── Whale trades ── (awaited: cheap, and user-facing on the Whales
    // page — an unawaited promise here risks getting killed mid-write
    // the same way the old fire-and-forget worker did)
    try {
      const trades = await fetchAllTrades()
      const notable = trades.filter(t => t.whaleScore >= 30 || t.dollarValue >= 100)
      const existingMeta = await cacheGetWithMeta(WHALE_TRADES_KEY)
      const existing = existingMeta.value || []
      const merged = [...notable, ...existing]
      const seen = new Set()
      const deduped = []
      for (const t of merged) {
        const key = `${t.time}|${t.platform}|${t.market}|${t.dollarValue}`
        if (!seen.has(key)) {
          seen.add(key)
          deduped.push(t)
        }
      }
      const cutoff = Date.now() - 24 * 60 * 60 * 1000
      const fresh = deduped
        .filter(t => new Date(t.time).getTime() > cutoff)
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 500)
      await cacheSet(WHALE_TRADES_KEY, fresh, WHALE_TRADES_TTL)
      if (fresh.length > 0) {
        const top = fresh.reduce((best, t) => t.dollarValue > best.dollarValue ? t : best, fresh[0])
        await cacheSet(WHALE_YESTERDAY_KEY, top, WHALE_YESTERDAY_TTL)
      }
    } catch (err) {
      console.error('[scanner-worker] Whale trades error:', err.message)
    }
    await checkpoint('whale_trades_complete')

    // ── Match (PRODUCTION — old matcher) ─────────────
    const tMatch = Date.now()
    let markets = matchMarkets(polymarkets, kalshiMarkets)
    timings.matchMs = Date.now() - tMatch
    await checkpoint('match_complete', { matchMs: timings.matchMs, rawMatches: markets.length })

    const preFilterCount = markets.length
    const preFilterEdges = markets.map(m => m.edge)
    console.log(`[scanner-worker] Matched ${markets.length} pairs (${timings.matchMs}ms)`)
    if (markets.length > 0) {
      console.log(`[scanner-worker] Pre-filter edges: ${preFilterEdges.slice(0, 10).join(', ')}`)
      console.log(`[scanner-worker] Pre-filter sample: ${markets[0]?.question?.slice(0, 60)} edge=${markets[0]?.edge} conf=${markets[0]?.matchConfidence}`)
    }

    // ── AI Verify (supplementary — adds aiConfidence/aiReason) ──
    const tVerify = Date.now()
    const aiResults = await aiVerifyMatches(markets).catch((err) => {
      console.error('[scanner-worker] AI verify error:', err.message)
      return null
    })
    timings.verifyMs = Date.now() - tVerify
    await checkpoint('verify_complete', { verifyMs: timings.verifyMs })

    // ── Post-process ────────────────────────────────
    const tPost = Date.now()

    if (aiResults) {
      markets = markets.map((m, i) => {
        const ai = aiResults.get(i)
        if (!ai) return m
        return {
          ...m,
          aiConfidence: ai.aiConfidence,
          aiReason: ai.aiReason,
        }
      })
    }

    // A "match" (same event, resolvable on both platforms) and an "arb
    // opportunity" (a match with real tradeable price edge) are different
    // things — this used to filter the whole cached match list down to
    // edge>0 only, which meant the Matched Markets page could never show
    // a match that happened to have identical/near-identical pricing.
    // Keep every match here; downstream consumers (the arb scanner route)
    // apply their own edge+confidence filter on top of this full list.
    const preEdgeFilter = markets.length
    markets = markets.filter(m => m.edge != null)
    const postEdgeFilter = markets.length
    console.log(`[scanner-worker] Filter: pre=${preFilterCount} → matched=${preEdgeFilter} → valid=${postEdgeFilter}`)

    markets = markets.map(m => {
      const { debug, ...rest } = m
      return rest
    })

    timings.postProcessMs = Date.now() - tPost
    timings.totalMs = Date.now() - t0

    // ── Cache for API (PRODUCTION) ───────────────────
    await cacheSet(CACHE_KEY, markets, CACHE_TTL)

    // An arb opportunity needs both a meaningful price gap (1 cent is
    // often just platform rounding/bid-ask noise, not real edge) and
    // reasonable match confidence — otherwise we're recommending trades
    // against matches we aren't actually sure are the same event.
    const isRealArb = m => m.edge >= ARB_MIN_EDGE && m.matchConfidence >= ARB_MIN_CONFIDENCE

    // ── Top Arb ─────────────────────────────────────
    const highConfArbs = markets.filter(isRealArb)
    highConfArbs.sort((a, b) => b.edge - a.edge)
    const bestArb = highConfArbs[0] || null
    if (bestArb) {
      await cacheSet(TOP_ARB_KEY, {
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
      await cacheSet(TOP_ARB_KEY, null, TOP_ARB_TTL)
    }

    // ── Scanner stats ───────────────────────────────
    const visibleArbs = markets.filter(isRealArb)
    let totalEdge = 0
    for (const m of visibleArbs) {
      totalEdge += (m.edge / 100) * parseVolume(m.volume)
    }
    await cacheSet(STATS_KEY, {
      scanned: exploreMarkets.length,
      matchedCount: preFilterCount,
      arbCount: visibleArbs.length,
      totalEdge,
    }, STATS_TTL)

    lastRunMs = Date.now()
    lastRunTimings = timings
    consecutiveErrors = 0
    firstCycleComplete = true
    lastCycleDebug = {
      polyCount: polymarkets.length,
      kalshiCount: kalshiMarkets.length,
      polyFetchError,
      kalshiFetchError,
      preFilterCount,
      postEdgeFilter,
      finalMatches: markets.length,
      categoryBreakdown,
      matchStats: getLastMatchStats(),
      samplePoly: polymarkets.slice(0, 3).map(m => m.question),
      sampleKalshi: kalshiMarkets.slice(0, 3).map(m => m.question),
    }
    // Persisted so it's readable from any instance, not just the one
    // that happened to run this cycle — the cron fires independently of
    // any request that might want to inspect what it found.
    await cacheSet(DEBUG_KEY, lastCycleDebug, CACHE_TTL)

    console.log(
      `[scanner-worker] Cycle complete: ${markets.length} results cached ` +
      `(fetch=${timings.fetchMs}ms match=${timings.matchMs}ms verify=${timings.verifyMs}ms total=${timings.totalMs}ms)`
    )

    // ── Discord alerts ──────────────────────────────
    const threshold = parseInt(process.env.DISCORD_ALERT_THRESHOLD || '5', 10)
    const alertMarkets = markets.filter(m => m.isArbSafe && m.difference >= threshold)
    if (alertMarkets.length > 0 && process.env.DISCORD_WEBHOOK_URL) {
      const msg = alertMarkets.map(formatMarketAlert).join('\n\n---\n\n')
      sendDiscordAlert(`🚨 **High-Spread Alert**\n\n${msg}`).catch(() => {})
    }

    // ── Shadow pipeline (async, non-blocking, never affects UI) ──
    // Throttled: GPT verdicts are already cached per question-pair (see
    // match-cache.js), so re-running every cron tick wouldn't call OpenAI
    // again for unchanged pairs — but the blocker pass + cache lookups
    // over the full candidate set still cost real time on every cycle.
    // Only worth doing often enough to catch newly-listed markets.
    const lastShadowRun = await cacheGet(SHADOW_LAST_RUN_KEY)
    if (!lastShadowRun || Date.now() - lastShadowRun >= SHADOW_PIPELINE_INTERVAL) {
      await cacheSet(SHADOW_LAST_RUN_KEY, Date.now(), SHADOW_PIPELINE_INTERVAL * 2)
      compareAndRecord(polymarkets, kalshiMarkets, markets)
        .then(() => cacheSet(COMPARE_KEY, getComparisonReport(), COMPARE_TTL))
        .catch(err => console.error('[scanner-worker] Shadow pipeline error:', err.message))
    } else {
      console.log(`[scanner-worker] Shadow pipeline skipped (last run ${Math.round((Date.now() - lastShadowRun) / 60000)}min ago)`)
    }

  } catch (err) {
    consecutiveErrors++
    timings.totalMs = Date.now() - t0
    lastRunTimings = timings
    console.error(`[scanner-worker] Cycle failed (attempt ${consecutiveErrors}):`, err.message)
  } finally {
    cycleInFlight = false
  }
}

export function ensureWorkerRunning() {
  if (workerRunning) return
  workerRunning = true

  // setInterval only helps on a traditional long-running Node process —
  // on serverless (Vercel), each invocation can be frozen/killed shortly
  // after the response is sent, and a cold start resets this module's
  // state entirely. On that platform, scans must be driven by the
  // cron route below instead (see triggerScan / api/cron/scan).
  console.log('[scanner-worker] Starting background worker (30s interval)')
  firstCyclePromise = runCycle()
  intervalHandle = setInterval(runCycle, REFRESH_INTERVAL)
  if (intervalHandle?.unref) intervalHandle.unref()
}

export async function waitForFirstCycle() {
  if (firstCyclePromise) await firstCyclePromise
}

// Runs one full fetch → match → verify → cache cycle and waits for it to
// finish. Meant to be called from a route that itself has a guaranteed
// execution budget (a Vercel Cron invocation, or an external scheduler
// hitting /api/cron/scan) — unlike ensureWorkerRunning(), the caller here
// actually awaits completion, so the platform won't kill it mid-fetch.
export async function triggerScan() {
  await runCycle()
  return {
    lastRunMs,
    timings: lastRunTimings,
    consecutiveErrors,
    debug: lastCycleDebug,
  }
}

export { CACHE_KEY, TOP_ARB_KEY, EXPLORE_KEY, STATS_KEY, WHALE_YESTERDAY_KEY, WHALE_TRADES_KEY, COMPARE_KEY, ARB_MIN_EDGE, ARB_MIN_CONFIDENCE }
