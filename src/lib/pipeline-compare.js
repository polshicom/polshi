/**
 * Shadow pipeline comparison harness.
 *
 * Accepts production matcher results (from the existing matchMarkets + aiVerify pipeline)
 * and runs a separate GPT-powered shadow pipeline (blocker → GPT-4o mini → cache).
 * Compares results and records metrics. Never affects production output.
 */

import { generateCandidates, pairHash } from './blocker.js'
import { gptVerifyPairs } from './gpt-verify.js'
import { getCached, setCached, getCacheStats } from './match-cache.js'

const MAX_CYCLES = 10
const cycleHistory = []

function normalizeQuestion(q) {
  return (q || '').toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim()
}

function matchKey(m) {
  const polyQ = normalizeQuestion(m.question)
  const kalshiQ = normalizeQuestion(m._kalshiQuestion)
  return `${polyQ}|||${kalshiQ}`
}

function buildConfidenceDistribution(verified) {
  const buckets = { '0-24': 0, '25-49': 0, '50-74': 0, '75-89': 0, '90-100': 0 }
  for (const m of verified) {
    const c = m.confidence
    if (c < 25) buckets['0-24']++
    else if (c < 50) buckets['25-49']++
    else if (c < 75) buckets['50-74']++
    else if (c < 90) buckets['75-89']++
    else buckets['90-100']++
  }
  return buckets
}

async function runShadowPipeline(polymarkets, kalshiMarkets) {
  const t0 = Date.now()
  const timings = { blockMs: 0, cacheCheckMs: 0, gptMs: 0, postMs: 0 }

  const tBlock = Date.now()
  const candidates = generateCandidates(polymarkets, kalshiMarkets)
  timings.blockMs = Date.now() - tBlock

  const tCache = Date.now()
  const allHashes = candidates.map(c =>
    pairHash(polymarkets[c.pi].question, kalshiMarkets[c.ki].question)
  )
  const cached = await getCached(allHashes)
  timings.cacheCheckMs = Date.now() - tCache

  const uncachedPairs = []
  for (let i = 0; i < candidates.length; i++) {
    const hash = allHashes[i]
    if (!cached.has(hash)) {
      const c = candidates[i]
      uncachedPairs.push({
        hash,
        polyQ: polymarkets[c.pi].question,
        kalshiQ: kalshiMarkets[c.ki].question,
        polyDesc: polymarkets[c.pi].description || '',
        kalshiDesc: kalshiMarkets[c.ki].description || '',
      })
    }
  }

  const tGpt = Date.now()
  let newResults = new Map()
  if (uncachedPairs.length > 0) {
    newResults = await gptVerifyPairs(uncachedPairs)
    const entries = []
    for (const [hash, result] of newResults) {
      const pair = uncachedPairs.find(p => p.hash === hash)
      if (pair) {
        entries.push({
          hash,
          polyQ: pair.polyQ,
          kalshiQ: pair.kalshiQ,
          result,
          model: 'gpt-4o-mini',
        })
      }
    }
    await setCached(entries).catch(() => {})
  }
  timings.gptMs = Date.now() - tGpt

  const tPost = Date.now()
  const allVerified = []
  for (let i = 0; i < candidates.length; i++) {
    const c = candidates[i]
    const hash = allHashes[i]
    const gptResult = cached.get(hash) || newResults.get(hash)
    if (!gptResult) continue

    const pm = polymarkets[c.pi]
    const km = kalshiMarkets[c.ki]
    const pmCents = Math.round(pm.prob * 100)
    const kCents = Math.round(km.prob * 100)
    const edgeCents = Math.abs(pmCents - kCents)

    allVerified.push({
      question: pm.question,
      _kalshiQuestion: km.question,
      polymarket: pmCents,
      kalshi: kCents,
      edge: edgeCents,
      same_market: gptResult.same_market,
      confidence: gptResult.confidence || 0,
      same_resolution: gptResult.same_resolution,
      explanation: gptResult.explanation || '',
      canonical: gptResult.canonical || '',
    })
  }

  const filtered = allVerified.filter(m =>
    m.same_market && m.confidence >= 75 && m.edge > 0 && m.edge <= 15
  )

  const seen = new Map()
  for (const m of filtered) {
    const existing = seen.get(m.question)
    if (!existing || m.confidence > existing.confidence) {
      seen.set(m.question, m)
    }
  }
  timings.postMs = Date.now() - tPost

  return {
    candidateCount: candidates.length,
    cacheHits: cached.size,
    cacheMisses: uncachedPairs.length,
    gptVerified: newResults.size,
    allVerified,
    filtered: [...seen.values()],
    timings,
    timeMs: Date.now() - t0,
    confidenceDistribution: buildConfidenceDistribution(allVerified),
  }
}

/**
 * Run shadow pipeline and compare against production results.
 *
 * @param {Array} polymarkets - raw fetched polymarket data
 * @param {Array} kalshiMarkets - raw fetched kalshi data
 * @param {Array} productionMatches - filtered matches from the current production matcher
 */
export async function compareAndRecord(polymarkets, kalshiMarkets, productionMatches) {
  console.log('[shadow] Running GPT shadow pipeline...')

  const shadowResult = await runShadowPipeline(polymarkets, kalshiMarkets)

  const prodKeys = new Set(productionMatches.map(matchKey))
  const shadowKeys = new Set(shadowResult.filtered.map(matchKey))

  const overlap = []
  const shadowOnly = []
  const prodOnly = []

  for (const m of shadowResult.filtered) {
    const key = matchKey(m)
    if (prodKeys.has(key)) {
      const prodMatch = productionMatches.find(o => matchKey(o) === key)
      overlap.push({
        question: m.question,
        kalshiQuestion: m._kalshiQuestion,
        prodConfidence: prodMatch?.aiConfidence ?? prodMatch?.matchConfidence ?? 0,
        shadowConfidence: m.confidence,
        edge: m.edge,
      })
    } else {
      shadowOnly.push({
        question: m.question,
        kalshiQuestion: m._kalshiQuestion,
        confidence: m.confidence,
        edge: m.edge,
        explanation: m.explanation,
      })
    }
  }

  for (const m of productionMatches) {
    const key = matchKey(m)
    if (!shadowKeys.has(key)) {
      prodOnly.push({
        question: m.question,
        kalshiQuestion: m._kalshiQuestion,
        prodConfidence: m.aiConfidence ?? m.matchConfidence ?? 0,
        edge: m.edge,
        reason: m.matchReason || m.aiReason || '',
      })
    }
  }

  const cycle = {
    timestamp: new Date().toISOString(),
    marketCounts: {
      polymarket: polymarkets.length,
      kalshi: kalshiMarkets.length,
    },
    production: {
      filteredMatches: productionMatches.length,
    },
    shadow: {
      model: 'gpt-4o-mini',
      candidatesPassed: shadowResult.candidateCount,
      cacheHits: shadowResult.cacheHits,
      cacheMisses: shadowResult.cacheMisses,
      gptVerified: shadowResult.gptVerified,
      totalVerified: shadowResult.allVerified.length,
      filteredMatches: shadowResult.filtered.length,
      timeMs: shadowResult.timeMs,
      timings: shadowResult.timings,
      confidenceDistribution: shadowResult.confidenceDistribution,
      cacheHitRate: shadowResult.candidateCount > 0
        ? ((shadowResult.cacheHits / shadowResult.candidateCount) * 100).toFixed(1) + '%'
        : '0%',
    },
    comparison: {
      overlap: overlap.length,
      shadowOnly: shadowOnly.length,
      prodOnly: prodOnly.length,
      overlapDetails: overlap,
      shadowOnlyDetails: shadowOnly,
      prodOnlyDetails: prodOnly,
    },
  }

  cycleHistory.push(cycle)
  if (cycleHistory.length > MAX_CYCLES) cycleHistory.shift()

  console.log(
    `[shadow] Production: ${cycle.production.filteredMatches} | ` +
    `Shadow: ${cycle.shadow.filteredMatches} (${cycle.shadow.timeMs}ms) | ` +
    `Overlap: ${cycle.comparison.overlap} | Shadow-only: ${cycle.comparison.shadowOnly} | Prod-only: ${cycle.comparison.prodOnly}`
  )

  return cycle
}

export function getComparisonReport() {
  if (cycleHistory.length === 0) return { cycles: 0, message: 'No comparison cycles recorded yet' }

  const summary = {
    cycles: cycleHistory.length,
    firstRun: cycleHistory[0].timestamp,
    lastRun: cycleHistory[cycleHistory.length - 1].timestamp,
    aggregated: {
      production: { avgMatches: 0 },
      shadow: { avgMatches: 0, avgTimeMs: 0, avgCandidates: 0, avgCacheHitRate: 0 },
      avgOverlap: 0,
      avgShadowOnly: 0,
      avgProdOnly: 0,
      allShadowOnlyMatches: [],
      allProdOnlyMatches: [],
      confidenceDistribution: { '0-24': 0, '25-49': 0, '50-74': 0, '75-89': 0, '90-100': 0 },
    },
    cycles_detail: cycleHistory,
  }

  let totalProdMatches = 0, totalShadowMatches = 0
  let totalShadowTime = 0
  let totalOverlap = 0, totalShadowOnly = 0, totalProdOnly = 0
  let totalCacheHits = 0, totalCandidateCount = 0

  const allShadowOnly = new Map()
  const allProdOnly = new Map()

  for (const c of cycleHistory) {
    totalProdMatches += c.production.filteredMatches
    totalShadowMatches += c.shadow.filteredMatches
    totalShadowTime += c.shadow.timeMs
    totalOverlap += c.comparison.overlap
    totalShadowOnly += c.comparison.shadowOnly
    totalProdOnly += c.comparison.prodOnly
    totalCacheHits += c.shadow.cacheHits
    totalCandidateCount += c.shadow.candidatesPassed

    for (const bucket of Object.keys(summary.aggregated.confidenceDistribution)) {
      summary.aggregated.confidenceDistribution[bucket] += (c.shadow.confidenceDistribution?.[bucket] || 0)
    }

    for (const m of c.comparison.shadowOnlyDetails) {
      const key = `${m.question}|||${m.kalshiQuestion}`
      if (!allShadowOnly.has(key)) allShadowOnly.set(key, { ...m, seenCount: 0 })
      allShadowOnly.get(key).seenCount++
    }
    for (const m of c.comparison.prodOnlyDetails) {
      const key = `${m.question}|||${m.kalshiQuestion}`
      if (!allProdOnly.has(key)) allProdOnly.set(key, { ...m, seenCount: 0 })
      allProdOnly.get(key).seenCount++
    }
  }

  const n = cycleHistory.length
  summary.aggregated.production.avgMatches = +(totalProdMatches / n).toFixed(1)
  summary.aggregated.shadow.avgMatches = +(totalShadowMatches / n).toFixed(1)
  summary.aggregated.shadow.avgTimeMs = Math.round(totalShadowTime / n)
  summary.aggregated.shadow.avgCandidates = totalCandidateCount > 0 ? Math.round(totalCandidateCount / n) : 0
  summary.aggregated.shadow.avgCacheHitRate = totalCandidateCount > 0
    ? +((totalCacheHits / totalCandidateCount) * 100).toFixed(1)
    : 0
  summary.aggregated.avgOverlap = +(totalOverlap / n).toFixed(1)
  summary.aggregated.avgShadowOnly = +(totalShadowOnly / n).toFixed(1)
  summary.aggregated.avgProdOnly = +(totalProdOnly / n).toFixed(1)

  summary.aggregated.allShadowOnlyMatches = [...allShadowOnly.values()]
    .sort((a, b) => b.seenCount - a.seenCount)
  summary.aggregated.allProdOnlyMatches = [...allProdOnly.values()]
    .sort((a, b) => b.seenCount - a.seenCount)

  return summary
}
