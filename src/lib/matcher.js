/**
 * Fingerprint-based market matcher.
 *
 * Replaces the old dice-coefficient / keyword-overlap approach with
 * structured fingerprint comparison. Each market gets a fingerprint
 * (entity, topic, action, date, numeric target, polarity, keywords)
 * and matches are scored by field-level compatibility checks.
 *
 * Priority: correctness over recall. False matches are worse than
 * missed matches for an arbitrage scanner.
 */

import { buildFingerprint, categorize } from './fingerprint.js'

// ── Helpers ──────────────────────────────────────────

function probToCents(prob) {
  return Math.round(prob * 100)
}

function formatVolume(vol) {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

// ── Date Compatibility ───────────────────────────────
// Different market types get different allowed date windows.

const DATE_WINDOWS = {
  sports_game:         1,
  sports_over_under:   1,
  sports_series:       7,
  sports_championship: 31,
  sports_award:        31,
  sports_relegation:   31,
  sports_transfer:     31,
  election:            14,
  nomination:          14,
  vp_nomination:       14,
  primary:             14,
  impeachment:         31,
  resignation:         31,
  fed_rates:           31,
  inflation:           31,
  macro:               31,
  crypto_price:        14,
  price_target:        14,
  ipo:                 31,
  acquisition:         31,
  bankruptcy:          31,
  geopolitical:        31,
  space:               31,
  tech:                31,
  climate:             31,
  generic_unknown:     7,
}

function datesCompatible(fpA, fpB) {
  // If both have date buckets, compare them
  if (fpA.dateBucket && fpB.dateBucket) {
    const dA = new Date(fpA.dateBucket)
    const dB = new Date(fpB.dateBucket)
    if (isNaN(dA.getTime()) || isNaN(dB.getTime())) return { compatible: false, reason: 'Invalid dates' }

    const diffDays = Math.abs(dA.getTime() - dB.getTime()) / (1000 * 60 * 60 * 24)
    const topic = fpA.topic !== 'generic_unknown' ? fpA.topic : fpB.topic
    const window = DATE_WINDOWS[topic] || 14
    if (diffDays <= window) {
      return { compatible: true, reason: `Dates within ${window}d window (${Math.round(diffDays)}d apart)` }
    }
    return { compatible: false, reason: `Dates too far apart (${Math.round(diffDays)}d > ${window}d window)` }
  }

  // If neither has a date bucket, check for year in text
  if (!fpA.dateBucket && !fpB.dateBucket) {
    if (fpA.yearInText && fpB.yearInText) {
      if (fpA.yearInText === fpB.yearInText) {
        return { compatible: true, reason: `Same year in text (${fpA.yearInText})` }
      }
      return { compatible: false, reason: `Different years (${fpA.yearInText} vs ${fpB.yearInText})` }
    }
    // No date info at all — allow only for macro topics
    const macroTopics = new Set(['fed_rates', 'inflation', 'macro', 'geopolitical'])
    if (macroTopics.has(fpA.topic) || macroTopics.has(fpB.topic)) {
      return { compatible: true, reason: 'No dates but macro topic' }
    }
    return { compatible: false, reason: 'No date information available' }
  }

  // One has date, other doesn't — check year in text of the one without
  const withDate = fpA.dateBucket ? fpA : fpB
  const without = fpA.dateBucket ? fpB : fpA
  const dateYear = withDate.dateBucket.substring(0, 4)

  if (without.yearInText) {
    if (without.yearInText === dateYear) {
      return { compatible: true, reason: `Year matches (${dateYear})` }
    }
    return { compatible: false, reason: `Year mismatch (${dateYear} vs ${without.yearInText})` }
  }

  // One has a date, the other has nothing — reject for safety
  return { compatible: false, reason: 'One market missing date' }
}

// ── Entity Compatibility ─────────────────────────────

function normalizeEntity(e) {
  if (!e) return null
  return e.toLowerCase().replace(/[^\w\s]/g, '').trim()
}

function entitySimilarity(a, b) {
  const na = normalizeEntity(a)
  const nb = normalizeEntity(b)
  if (!na || !nb) return 0
  if (na === nb) return 1.0

  // Check containment (e.g., "Trump" matches "Donald Trump")
  if (na.includes(nb) || nb.includes(na)) return 0.9

  // Check surname match (last word)
  const aParts = na.split(/\s+/)
  const bParts = nb.split(/\s+/)
  const aLast = aParts[aParts.length - 1]
  const bLast = bParts[bParts.length - 1]
  if (aLast.length >= 4 && aLast === bLast) return 0.85

  return 0
}

function entityCompatible(fpA, fpB) {
  // Both have primary entities
  if (fpA.entity && fpB.entity) {
    const sim = entitySimilarity(fpA.entity, fpB.entity)
    if (sim >= 0.8) {
      return { compatible: true, reason: `Entity match: "${fpA.entity}" ~ "${fpB.entity}" (${sim})` }
    }
    return { compatible: false, reason: `Entity mismatch: "${fpA.entity}" vs "${fpB.entity}" (${sim})` }
  }

  // Check allEntities overlap if primary is missing
  if (fpA.allEntities.length > 0 && fpB.allEntities.length > 0) {
    const setA = new Set(fpA.allEntities.map(e => normalizeEntity(e)))
    const setB = new Set(fpB.allEntities.map(e => normalizeEntity(e)))
    let overlap = 0
    for (const e of setA) {
      if (setB.has(e)) overlap++
      // Also check surname containment
      for (const f of setB) {
        if (e && f && e !== f) {
          if (e.includes(f) || f.includes(e)) overlap++
        }
      }
    }
    if (overlap > 0) {
      return { compatible: true, reason: `Entity overlap (${overlap} shared)` }
    }
    return { compatible: false, reason: `No entity overlap: [${fpA.allEntities.join(', ')}] vs [${fpB.allEntities.join(', ')}]` }
  }

  // If neither has entities — allow only for macro-type topics
  const macroTopics = new Set(['fed_rates', 'inflation', 'macro', 'geopolitical', 'climate'])
  if (macroTopics.has(fpA.topic) && macroTopics.has(fpB.topic)) {
    return { compatible: true, reason: 'No entities but matching macro topic' }
  }
  if (fpA.allEntities.length === 0 && fpB.allEntities.length === 0) {
    // Both have no entities — accept only if topics match and aren't generic
    if (fpA.topic === fpB.topic && fpA.topic !== 'generic_unknown') {
      return { compatible: true, reason: 'No entities but same specific topic' }
    }
    return { compatible: false, reason: 'No entities and no clear topic match' }
  }

  // One has entities, the other doesn't — reject
  return { compatible: false, reason: 'One market missing entities' }
}

// ── Topic Compatibility ──────────────────────────────

const COMPATIBLE_TOPIC_PAIRS = new Set([
  'crypto_price|price_target',
  'price_target|crypto_price',
  'election|primary',
  'primary|election',
])

function topicCompatible(fpA, fpB) {
  if (fpA.topic === 'generic_unknown' || fpB.topic === 'generic_unknown') {
    return { compatible: false, reason: `Unknown topic: "${fpA.topic}" / "${fpB.topic}"` }
  }
  if (fpA.topic === fpB.topic) {
    return { compatible: true, reason: `Same topic: ${fpA.topic}` }
  }
  const pair = `${fpA.topic}|${fpB.topic}`
  if (COMPATIBLE_TOPIC_PAIRS.has(pair)) {
    return { compatible: true, reason: `Compatible topics: ${fpA.topic} <> ${fpB.topic}` }
  }
  return { compatible: false, reason: `Incompatible topics: "${fpA.topic}" vs "${fpB.topic}"` }
}

// ── Mismatch Kill List ───────────────────────────────

const CONFLICTING_ACTIONS = new Set([
  'run_for|win',
  'win|run_for',
  'be_nominee|win',
  'win|be_nominee',
  'be_nominee|run_for',
  'run_for|be_nominee',
  'increase|decrease',
  'decrease|increase',
  'above|below',
  'below|above',
  'reach|below',
  'below|reach',
  'acquire|ipo',
  'ipo|acquire',
  'resign|impeach',
  'impeach|resign',
  'launch|land',
  'land|launch',
  'relegate|promote',
  'promote|relegate',
  'relegate|win',
  'win|relegate',
])

function hasMismatchConflict(fpA, fpB) {
  // Action conflicts
  if (fpA.action !== 'unknown' && fpB.action !== 'unknown') {
    const pair = `${fpA.action}|${fpB.action}`
    if (CONFLICTING_ACTIONS.has(pair)) {
      return { conflict: true, reason: `Action conflict: ${fpA.action} vs ${fpB.action}` }
    }
  }

  // Polarity conflicts
  if (fpA.polarity !== fpB.polarity) {
    return { conflict: true, reason: `Polarity conflict: ${fpA.polarity} vs ${fpB.polarity}` }
  }

  // Numeric target conflicts — significant difference
  if (fpA.numericTarget != null && fpB.numericTarget != null) {
    const ratio = Math.min(fpA.numericTarget, fpB.numericTarget) /
                  Math.max(fpA.numericTarget, fpB.numericTarget)
    if (ratio < 0.5) {
      return { conflict: true, reason: `Numeric target conflict: ${fpA.numericTarget} vs ${fpB.numericTarget} (ratio ${ratio.toFixed(2)})` }
    }
  }

  // Month conflict — if both mention specific months and they differ
  if (fpA.monthInText && fpB.monthInText && fpA.monthInText !== fpB.monthInText) {
    // For sports and short-term events, different months = different event
    const shortTermTopics = new Set(['sports_game', 'sports_series', 'fed_rates', 'crypto_price', 'price_target'])
    if (shortTermTopics.has(fpA.topic) || shortTermTopics.has(fpB.topic)) {
      return { conflict: true, reason: `Month conflict: ${fpA.monthInText} vs ${fpB.monthInText}` }
    }
  }

  return { conflict: false, reason: null }
}

// ── Keyword Overlap (supplementary signal) ───────────

function keywordOverlapScore(fpA, fpB) {
  if (fpA.keywords.length === 0 || fpB.keywords.length === 0) return 0
  const setA = new Set(fpA.keywords)
  const setB = new Set(fpB.keywords)
  let overlap = 0
  for (const w of setA) {
    if (setB.has(w)) overlap++
  }
  const smaller = Math.min(setA.size, setB.size)
  return smaller > 0 ? overlap / smaller : 0
}

// ── Candidate Scoring ────────────────────────────────

const MATCH_THRESHOLD = 80

function scoreCandidate(fpA, fpB) {
  let score = 0
  const breakdown = []

  // 1. Entity match (+40)
  const entity = entityCompatible(fpA, fpB)
  if (entity.compatible) {
    score += 40
    breakdown.push(`+40 entity: ${entity.reason}`)
  } else {
    // Entity incompatibility is a hard reject in most cases
    return { score: -1, breakdown: [`REJECT entity: ${entity.reason}`], rejected: true, rejectReason: entity.reason }
  }

  // 2. Topic match (+20)
  const topic = topicCompatible(fpA, fpB)
  if (topic.compatible) {
    score += 20
    breakdown.push(`+20 topic: ${topic.reason}`)
  } else {
    return { score: -1, breakdown: [`REJECT topic: ${topic.reason}`], rejected: true, rejectReason: topic.reason }
  }

  // 3. Action match (+15)
  if (fpA.action !== 'unknown' && fpB.action !== 'unknown') {
    if (fpA.action === fpB.action) {
      score += 15
      breakdown.push(`+15 action: ${fpA.action}`)
    } else {
      score -= 15
      breakdown.push(`-15 action mismatch: ${fpA.action} vs ${fpB.action}`)
    }
  } else if (fpA.action === 'unknown' && fpB.action === 'unknown') {
    // Both unknown — mild penalty
    score -= 5
    breakdown.push('-5 both actions unknown')
  } else {
    // One unknown — penalty
    score -= 10
    breakdown.push(`-10 action unclear: ${fpA.action} / ${fpB.action}`)
  }

  // 4. Date compatibility (+15)
  const date = datesCompatible(fpA, fpB)
  if (date.compatible) {
    score += 15
    breakdown.push(`+15 date: ${date.reason}`)
  } else {
    score -= 20
    breakdown.push(`-20 date: ${date.reason}`)
  }

  // 5. Numeric target match (+10)
  if (fpA.numericTarget != null && fpB.numericTarget != null) {
    const ratio = Math.min(fpA.numericTarget, fpB.numericTarget) /
                  Math.max(fpA.numericTarget, fpB.numericTarget)
    if (ratio >= 0.9) {
      score += 10
      breakdown.push(`+10 target match: ${fpA.numericTarget} ~ ${fpB.numericTarget}`)
    } else if (ratio >= 0.5) {
      score -= 5
      breakdown.push(`-5 target close but different: ${fpA.numericTarget} vs ${fpB.numericTarget}`)
    }
    // ratio < 0.5 would already be caught by hasMismatchConflict
  } else if ((fpA.numericTarget != null) !== (fpB.numericTarget != null)) {
    // One has a target, other doesn't — penalize for price/crypto topics
    const targetTopics = new Set(['crypto_price', 'price_target', 'inflation', 'fed_rates'])
    if (targetTopics.has(fpA.topic) || targetTopics.has(fpB.topic)) {
      score -= 10
      breakdown.push('-10 one market has numeric target, other does not')
    }
  }

  // 6. Mismatch kill check (-50)
  const mismatch = hasMismatchConflict(fpA, fpB)
  if (mismatch.conflict) {
    return { score: -1, breakdown: [`REJECT conflict: ${mismatch.reason}`], rejected: true, rejectReason: mismatch.reason }
  }

  // 7. Keyword overlap bonus (supplementary, +5 to +10)
  const kwScore = keywordOverlapScore(fpA, fpB)
  if (kwScore >= 0.6) {
    score += 10
    breakdown.push(`+10 keyword overlap: ${(kwScore * 100).toFixed(0)}%`)
  } else if (kwScore >= 0.4) {
    score += 5
    breakdown.push(`+5 keyword overlap: ${(kwScore * 100).toFixed(0)}%`)
  } else if (kwScore < 0.2) {
    score -= 5
    breakdown.push(`-5 low keyword overlap: ${(kwScore * 100).toFixed(0)}%`)
  }

  return { score, breakdown, rejected: false, rejectReason: null }
}

// ── Sub-market Answer Gate ───────────────────────────
// Kalshi multi-candidate markets use "Parent - CandidateName" format.
// If a Kalshi question has this suffix, the Polymarket question must
// mention that candidate, or we skip entirely.

function extractKalshiAnswer(question) {
  const dashIdx = question.lastIndexOf(' - ')
  if (dashIdx === -1 || dashIdx < 10) return null
  return question.slice(dashIdx + 3).trim().toLowerCase()
}

function questionContainsAnswer(question, answer) {
  const qLower = question.toLowerCase()
  if (qLower.includes(answer)) return true
  const answerWords = answer.split(/\s+/).filter(w => w.length >= 3)
  if (answerWords.length === 0) return false
  return answerWords.every(w => qLower.includes(w))
}

// ── Build Match Entry ────────────────────────────────

function buildMatch(pm, km, score, breakdown, fpPM, fpK) {
  const pmProb = pm.prob
  const kProb = km.prob
  const pmCents = probToCents(pmProb)
  const kCents = probToCents(kProb)
  const combinedVol = (pm.volume || 0) + (km.volume || 0)
  const edgeCents = Math.round(Math.abs(pmProb - kProb) * 100)

  // Confidence based on score
  let confidence
  if (score >= 95) confidence = 'High'
  else if (score >= 85) confidence = 'Medium'
  else confidence = 'Low'

  // Verified only if score is high and edge is reasonable
  const verified = score >= MATCH_THRESHOLD && edgeCents > 0 && edgeCents <= 15
  const isArbSafe = verified && score >= 85

  let buyPlatform = null
  if (edgeCents > 0) {
    buyPlatform = pmCents <= kCents ? 'polymarket' : 'kalshi'
  }

  return {
    question: pm.question,
    category: categorize(pm.question),
    polymarket: pmCents,
    kalshi: kCents,
    edge: edgeCents,
    difference: edgeCents,
    buyPlatform,
    totalCost: 100 - edgeCents,
    verified,
    isArbSafe,
    matchConfidence: score,
    matchReason: breakdown.join(' | '),
    confidence,
    matchScore: score / 100,
    volume: formatVolume(combinedVol),
    polymarketUrl: pm.url || null,
    kalshiUrl: km.url || null,
    endDate: pm.endDate || km.endDate || null,
    _kalshiQuestion: km.question,
    _polyDescription: pm.description || '',
    _kalshiDescription: km.description || '',
    _fingerprints: { polymarket: fpPM, kalshi: fpK },
    updated: 'just now',
    debug: {
      poly_prob: pmProb,
      kalshi_prob: kProb,
      poly_source: pm.priceSource,
      kalshi_source: km.priceSource,
      poly_raw: pm._raw,
      kalshi_raw: km._raw,
    },
  }
}

// ── Main Matching ────────────────────────────────────

export function matchMarkets(polymarkets, kalshiMarkets) {
  // Step 1: Build fingerprints for all markets
  const polyFPs = polymarkets.map(m => buildFingerprint(m))
  const kalshiFPs = kalshiMarkets.map(m => buildFingerprint(m))

  // Step 2: For each Polymarket market, score all Kalshi candidates
  const candidates = [] // { pmIdx, kIdx, score, breakdown, fpPM, fpK }
  const rejections = [] // for debug logging

  for (let pi = 0; pi < polymarkets.length; pi++) {
    const fpPM = polyFPs[pi]

    for (let ki = 0; ki < kalshiMarkets.length; ki++) {
      const fpK = kalshiFPs[ki]

      // Pre-gate: Kalshi sub-market answer must be mentioned in Polymarket question
      const kAnswer = extractKalshiAnswer(kalshiMarkets[ki].question)
      if (kAnswer && !questionContainsAnswer(polymarkets[pi].question, kAnswer)) continue

      // Score this candidate pair
      const result = scoreCandidate(fpPM, fpK)

      if (result.rejected) {
        rejections.push({
          polymarket: polymarkets[pi].question,
          kalshi: kalshiMarkets[ki].question,
          reason: result.rejectReason,
        })
        continue
      }

      if (result.score >= MATCH_THRESHOLD) {
        candidates.push({
          pmIdx: pi,
          kIdx: ki,
          score: result.score,
          breakdown: result.breakdown,
          fpPM,
          fpK,
        })
      }
    }
  }

  // Step 3: Sort candidates by score descending, then greedily assign
  // Prevents the same Kalshi market from matching multiple Polymarket markets
  candidates.sort((a, b) => b.score - a.score)

  const usedPoly = new Set()
  const usedKalshi = new Set()
  const matches = []

  for (const c of candidates) {
    if (usedPoly.has(c.pmIdx) || usedKalshi.has(c.kIdx)) continue

    usedPoly.add(c.pmIdx)
    usedKalshi.add(c.kIdx)

    const pm = polymarkets[c.pmIdx]
    const km = kalshiMarkets[c.kIdx]

    matches.push(buildMatch(pm, km, c.score, c.breakdown, c.fpPM, c.fpK))
  }

  // Sort: verified first (by edge desc), then unverified (by edge desc)
  matches.sort((a, b) => {
    if (a.verified && !b.verified) return -1
    if (!a.verified && b.verified) return 1
    const aEdge = a.edge ?? -1
    const bEdge = b.edge ?? -1
    return bEdge - aEdge
  })

  // Log summary
  console.log(`[matcher] ${polymarkets.length} poly × ${kalshiMarkets.length} kalshi → ${candidates.length} candidates → ${matches.length} matches (${matches.filter(m => m.verified).length} verified)`)
  if (rejections.length > 0) {
    // Log a few sample rejections for debugging
    const samples = rejections.slice(0, 5)
    for (const r of samples) {
      console.log(`[matcher] REJECTED: "${r.polymarket.substring(0, 50)}" × "${r.kalshi.substring(0, 50)}" — ${r.reason}`)
    }
  }

  return matches
}

export { categorize } from './fingerprint.js'
