/**
 * Category-first market matcher with fingerprint-enhanced scoring.
 *
 * 1. Pre-compute fingerprints + keywords for every market (once)
 * 2. Categorize → compare within categories using multi-signal scoring
 * 3. Cross-category fallback for miscategorized markets
 * 4. Greedy 1:1 assignment (best score wins, with edge-weighted tiebreak)
 * 5. Build result with edge/arb calculations
 */

import { categorize, buildFingerprint } from './fingerprint.js'

// ── Helpers ──────────────────────────────────────────

function probToCents(prob) {
  return Math.round(prob * 100)
}

function formatVolume(vol) {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

// ── Text Normalization ──────────────────────────────

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'will', 'would', 'could', 'should', 'may', 'might', 'can', 'do', 'does',
  'did', 'has', 'have', 'had', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'or', 'and', 'not', 'no', 'if', 'but', 'so', 'as', 'it',
  'its', 'this', 'that', 'than', 'then', 'what', 'which', 'who', 'whom',
  'how', 'when', 'where', 'why', 'all', 'each', 'any', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'only', 'very', 'just',
  'before', 'after', 'between', 'during', 'about', 'into', 'through',
  'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under',
  'there', 'here', 'they', 'them', 'their', 'we', 'our', 'you', 'your',
  'he', 'she', 'his', 'her', 'my', 'me', 'i',
])

function normalizeText(text) {
  return text
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !STOPWORDS.has(w))
}

function getKeywords(market) {
  const q = market.question || ''
  const desc = market.description || ''
  const qWords = normalizeText(q)
  const descWords = normalizeText(desc).slice(0, 10)
  const set = new Set(qWords)
  for (const w of descWords) set.add(w)
  return set
}

function getBigrams(market) {
  const words = normalizeText(market.question || '')
  const bigrams = new Set()
  for (let i = 0; i < words.length - 1; i++) {
    bigrams.add(`${words[i]} ${words[i + 1]}`)
  }
  return bigrams
}

// ── Similarity Scoring ──────────────────────────────

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0
  let intersection = 0
  for (const w of setA) {
    if (setB.has(w)) intersection++
  }
  const union = setA.size + setB.size - intersection
  return union > 0 ? intersection / union : 0
}

function overlapCoefficient(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0
  let intersection = 0
  for (const w of setA) {
    if (setB.has(w)) intersection++
  }
  return intersection / Math.min(setA.size, setB.size)
}

// ── Kalshi Sub-market Gate ──────────────────────────

function questionContainsAnswer(question, answer) {
  const qLower = question.toLowerCase()
  if (qLower.includes(answer)) return true
  const words = answer.split(/\s+/).filter(w => w.length >= 3)
  return words.length > 0 && words.every(w => qLower.includes(w))
}

// ── Pre-computed Market Data ────────────────────────

function precompute(market) {
  return {
    keywords: getKeywords(market),
    bigrams: getBigrams(market),
    fp: buildFingerprint(market),
    category: categorize(market.question),
  }
}

// ── Event-Group Matching ─────────────────────────────
// Many markets belong to a multi-outcome event (e.g. Polymarket's
// "Presidential Election Winner 2028" or Kalshi's "NBA Finals Winner",
// each containing one binary market per candidate/team). Matching the
// *event* first — before comparing individual outcomes — means we only
// ever compare candidates/teams from the same event, instead of every
// candidate against every candidate across the whole platform. That
// gives both better precision (no cross-event false positives) and
// better recall (a context-confirmed match can clear a lower bar).
//
// This phase is purely additive: it feeds extra high-confidence
// candidates into the same candidateMap used by the category-based
// pass, so it can only add matches, never remove ones the fallback
// logic would otherwise have found.

const EVENT_MATCH_THRESHOLD = 25
const EVENT_CONTEXT_BONUS = 15

function groupIndicesByEvent(markets) {
  const groups = new Map()
  for (let i = 0; i < markets.length; i++) {
    const key = markets[i].eventKey
    if (key == null) continue
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(i)
  }
  // Only multi-outcome events are useful here — a group of one is just
  // a standalone market, already covered by the category-based pass.
  for (const [key, idxs] of groups) {
    if (idxs.length < 2) groups.delete(key)
  }
  return groups
}

function eventSynthetic(markets, idxs) {
  const title = markets[idxs[0]].eventTitle || markets[idxs[0]].question
  return { question: title, description: '', endDate: null }
}

function addEventGroupCandidates(polymarkets, kalshiMarkets, polyData, kalshiData, candidateMap) {
  const polyGroups = groupIndicesByEvent(polymarkets)
  const kalshiGroups = groupIndicesByEvent(kalshiMarkets)
  if (polyGroups.size === 0 || kalshiGroups.size === 0) return

  const polyEvents = [...polyGroups.entries()].map(([key, idxs]) => {
    const synth = eventSynthetic(polymarkets, idxs)
    return { key, idxs, synth, data: precompute(synth) }
  })
  const kalshiEvents = [...kalshiGroups.entries()].map(([key, idxs]) => {
    const synth = eventSynthetic(kalshiMarkets, idxs)
    return { key, idxs, synth, data: precompute(synth) }
  })

  // Score every event-pair (small N — cheap even as a full cross product)
  const eventCandidates = []
  for (const pe of polyEvents) {
    for (const ke of kalshiEvents) {
      const result = scorePair(pe.synth, ke.synth, pe.data, ke.data)
      if (result.score >= EVENT_MATCH_THRESHOLD) {
        eventCandidates.push({ pe, ke, score: result.score })
      }
    }
  }

  // Greedy 1:1 event assignment — best score wins
  eventCandidates.sort((a, b) => b.score - a.score)
  const usedPolyEvents = new Set()
  const usedKalshiEvents = new Set()
  const matchedEventPairs = []
  for (const c of eventCandidates) {
    if (usedPolyEvents.has(c.pe.key) || usedKalshiEvents.has(c.ke.key)) continue
    usedPolyEvents.add(c.pe.key)
    usedKalshiEvents.add(c.ke.key)
    matchedEventPairs.push(c)
  }

  console.log(`[matcher] Event groups: ${polyEvents.length} poly × ${kalshiEvents.length} kalshi → ${matchedEventPairs.length} event matches`)

  // Within each matched event pair, compare every outcome combination.
  // We already know the surrounding context matches, so boost the score
  // and let a slightly weaker text match still clear the bar.
  for (const { pe, ke } of matchedEventPairs) {
    for (const pi of pe.idxs) {
      for (const ki of ke.idxs) {
        const result = scorePair(polymarkets[pi], kalshiMarkets[ki], polyData[pi], kalshiData[ki])
        const boosted = Math.min(100, result.score + EVENT_CONTEXT_BONUS)
        if (boosted < MATCH_THRESHOLD) continue
        const key = `${pi}:${ki}`
        const existing = candidateMap.get(key)
        if (!existing || boosted > existing.score) {
          candidateMap.set(key, {
            pmIdx: pi,
            kIdx: ki,
            score: boosted,
            reason: `${result.reason} [event: "${pe.synth.question}" ↔ "${ke.synth.question}", +${EVENT_CONTEXT_BONUS}]`,
            cat: polyData[pi].category,
            eventTitle: pe.synth.question,
          })
        }
      }
    }
  }
}

// ── Pair Scoring (multi-signal) ─────────────────────
// Uses pre-computed keywords, bigrams, and fingerprints.

// Diagnostic counters for a single matchMarkets() call — reset at the
// start of each run, read back via getLastMatchStats(). Not meant to be
// precise under concurrent calls; this module only ever runs one scan
// cycle at a time per the scanner-worker's reentrancy guard.
let matchStats = null

function scorePair(pm, km, pmData, kmData) {
  const pmQ = pm.question || ''

  if (matchStats) matchStats.pairsScored++

  // Kalshi sub-market gate — only applies when this market is a genuine
  // named sub-outcome of a multi-candidate event. yesSubTitle is only
  // ever set by kalshi.js when the event actually has multiple outcomes
  // (see fetchKalshiMarkets' isMultiMarket check) — unlike guessing from
  // "question text contains a dash," which also fires on single-outcome
  // markets whose own natural title happens to contain one (e.g. "Fed
  // Decision - December Meeting"), incorrectly gating them against a
  // fragment of their own title. That false-positive was responsible for
  // the gate rejecting 86% of all scored pairs.
  const kAnswer = km.yesSubTitle ? km.yesSubTitle.toLowerCase() : null
  if (kAnswer && !questionContainsAnswer(pmQ, kAnswer)) {
    if (matchStats) matchStats.gateRejects++
    return { score: 0, reason: 'sub-market mismatch' }
  }

  const pmFp = pmData.fp
  const kmFp = kmData.fp

  // Signal 1: Keyword similarity (unigrams)
  const jaccard = jaccardSimilarity(pmData.keywords, kmData.keywords)
  const overlap = overlapCoefficient(pmData.keywords, kmData.keywords)
  const unigramScore = (jaccard * 0.4 + overlap * 0.6) * 50

  // Signal 2: Bigram similarity (phrase matching)
  const bigramJaccard = jaccardSimilarity(pmData.bigrams, kmData.bigrams)
  const bigramScore = bigramJaccard * 15

  let bonus = 0
  let penalty = 0
  const reasons = []

  // Signal 3: Canonical entity overlap from fingerprints
  const pmEntities = new Set((pmFp.allEntities || []).map(e => e.toLowerCase()))
  const kmEntities = new Set((kmFp.allEntities || []).map(e => e.toLowerCase()))
  if (pmEntities.size > 0 && kmEntities.size > 0) {
    let entityOverlap = 0
    for (const e of pmEntities) {
      if (kmEntities.has(e)) entityOverlap++
    }
    const entityRatio = entityOverlap / Math.min(pmEntities.size, kmEntities.size)
    if (entityRatio >= 0.5) { bonus += 12; reasons.push(`${entityOverlap} entities`) }

    // Primary entity must match if both have one
    if (pmFp.entity && kmFp.entity) {
      const pmPrimary = pmFp.entity.toLowerCase()
      const kmPrimary = kmFp.entity.toLowerCase()
      if (pmPrimary === kmPrimary || pmPrimary.includes(kmPrimary) || kmPrimary.includes(pmPrimary)) {
        bonus += 8
        reasons.push('same subject')
      } else if (entityOverlap === 0) {
        penalty += 12
        reasons.push('diff subject')
      }
    } else if (entityOverlap === 0) {
      // Neither side had a single unambiguous "primary" entity (e.g.
      // multiple names in one question), but if they share NONE of their
      // extracted entities at all, that's still real evidence they're
      // about different things — e.g. "Trump pardon Musk" vs "Ukraine
      // election" share zero entities and shouldn't coast through on
      // unrelated signals like a shared "before 2027" deadline.
      penalty += 10
      reasons.push('no shared entities')
    }
  }

  // Signal 4: Topic match from fingerprints
  const pmHasTopic = pmFp.topic && pmFp.topic !== 'generic_unknown'
  const kmHasTopic = kmFp.topic && kmFp.topic !== 'generic_unknown'
  if (pmHasTopic && kmHasTopic) {
    if (pmFp.topic === kmFp.topic) { bonus += 8; reasons.push('same topic') }
    else { penalty += 5; reasons.push('diff topic') }
  } else if (pmHasTopic !== kmHasTopic) {
    // One side has a classifiable topic and the other doesn't — real
    // market phrasing varies a lot, so this alone is weak evidence of a
    // mismatch, not strong. Keep it as a small tie-breaking nudge, not a
    // gatekeeper, or it ends up rejecting lots of legitimate matches that
    // simply don't fit the hand-written topic regexes on one side.
    penalty += 2
    reasons.push('topic unclear on one side')
  }

  // Signal 5: Action match
  const pmHasAction = pmFp.action && pmFp.action !== 'unknown'
  const kmHasAction = kmFp.action && kmFp.action !== 'unknown'
  if (pmHasAction && kmHasAction) {
    if (pmFp.action === kmFp.action) { bonus += 5; reasons.push('same action') }
    else if (
      (pmFp.action === 'above' && kmFp.action === 'reach') ||
      (pmFp.action === 'reach' && kmFp.action === 'above') ||
      (pmFp.action === 'win' && kmFp.action === 'happen') ||
      (pmFp.action === 'happen' && kmFp.action === 'win')
    ) {
      bonus += 3
      reasons.push('similar action')
    } else {
      penalty += 4
      reasons.push('diff action')
    }
  } else if (pmHasAction !== kmHasAction) {
    penalty += 1
    reasons.push('action unclear on one side')
  }

  // Signal 6: Scope match (tournament vs group vs match)
  if (pmFp.scope && kmFp.scope) {
    if (pmFp.scope !== kmFp.scope) { penalty += 15; reasons.push('diff scope') }
  }

  // Signal 7: Year match
  const pmYear = pmFp.yearInText
  const kmYear = kmFp.yearInText
  if (pmYear && kmYear) {
    if (pmYear === kmYear) { bonus += 8; reasons.push('same year') }
    else { penalty += 20; reasons.push('diff year') }
  }

  // Signal 8: Month match
  const pmMonth = pmFp.monthInText
  const kmMonth = kmFp.monthInText
  if (pmMonth && kmMonth) {
    if (pmMonth === kmMonth) { bonus += 5; reasons.push('same month') }
    else { penalty += 10; reasons.push('diff month') }
  }

  // Signal 9: Numeric target match
  const pmTarget = pmFp.numericTarget
  const kmTarget = kmFp.numericTarget
  if (pmTarget != null && kmTarget != null) {
    const ratio = Math.min(pmTarget, kmTarget) / Math.max(pmTarget, kmTarget)
    if (ratio >= 0.95) { bonus += 15; reasons.push('same target') }
    else if (ratio >= 0.8) { bonus += 5; reasons.push('close target') }
    else if (ratio < 0.5) { penalty += 15; reasons.push('diff target') }
  }

  // Signal 10: Polarity match
  if (pmFp.polarity !== kmFp.polarity) {
    penalty += 15
    reasons.push('polarity mismatch')
  }

  // Signal 11: End date proximity — one of the strongest disambiguating
  // signals we have. Platforms round resolution deadlines differently
  // (Kalshi's close_time vs Polymarket's endDate can land a day or two
  // apart for the literal same event), so close-but-not-identical dates
  // are treated as strong confirmation, not a strict requirement. But two
  // markets with genuinely distant end dates are very rarely the same
  // event — e.g. a NZ election and a UK election can both involve a
  // "Labour Party" and superficially similar text, but their resolution
  // dates are months apart, which should weigh heavily against the match.
  if (pm.endDate && km.endDate) {
    const pmDate = new Date(pm.endDate)
    const kmDate = new Date(km.endDate)
    if (!isNaN(pmDate) && !isNaN(kmDate)) {
      const diffDays = Math.abs(pmDate - kmDate) / (1000 * 60 * 60 * 24)
      if (diffDays <= 2) { bonus += 18; reasons.push('same end date') }
      else if (diffDays <= 7) { bonus += 10; reasons.push('close end date') }
      else if (diffDays <= 21) { bonus += 2; reasons.push('plausible end date') }
      else if (diffDays <= 45) { penalty += 8; reasons.push('different end dates') }
      else { penalty += 22; reasons.push('far end dates') }
    }
  }

  const textScore = unigramScore + bigramScore
  const finalScore = Math.max(0, Math.min(100, Math.round(textScore + bonus - penalty)))
  if (matchStats) {
    if (finalScore >= MATCH_THRESHOLD) matchStats.aboveThreshold++
    else if (finalScore >= MATCH_THRESHOLD - 10) matchStats.nearMiss++
  }
  return {
    score: finalScore,
    reason: `text=${textScore.toFixed(0)} +${bonus} -${penalty} [${reasons.join(', ')}]`,
    jaccard: Math.round(jaccard * 100),
    overlap: Math.round(overlap * 100),
  }
}

// ── Build Match Entry ────────────────────────────────

function buildMatch(pm, km, score, reason, pmCategory, eventTitle) {
  const pmProb = pm.prob
  const kProb = km.prob
  const pmCents = probToCents(pmProb)
  const kCents = probToCents(kProb)
  const combinedVol = (pm.volume || 0) + (km.volume || 0)
  const edgeCents = Math.round(Math.abs(pmProb - kProb) * 100)

  let confidence
  if (score >= 70) confidence = 'High'
  else if (score >= 50) confidence = 'Medium'
  else confidence = 'Low'

  const verified = score >= 45 && edgeCents > 0
  const isArbSafe = verified && score >= 65

  let buyPlatform = null
  if (edgeCents > 0) {
    buyPlatform = pmCents <= kCents ? 'polymarket' : 'kalshi'
  }

  return {
    question: pm.question,
    category: pmCategory || categorize(pm.question),
    eventTitle: eventTitle || null,
    polymarket: pmCents,
    kalshi: kCents,
    edge: edgeCents,
    difference: edgeCents,
    buyPlatform,
    totalCost: 100 - edgeCents,
    verified,
    isArbSafe,
    matchConfidence: score,
    matchReason: reason,
    confidence,
    matchScore: score / 100,
    volume: formatVolume(combinedVol),
    polymarketUrl: pm.url || null,
    kalshiUrl: km.url || null,
    endDate: pm.endDate || km.endDate || null,
    _kalshiQuestion: km.question,
    _polyDescription: pm.description || '',
    _kalshiDescription: km.description || '',
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

const MATCH_THRESHOLD = 24

export function getLastMatchStats() {
  return matchStats
}

export function matchMarkets(polymarkets, kalshiMarkets) {
  matchStats = { pairsScored: 0, gateRejects: 0, aboveThreshold: 0, nearMiss: 0 }

  // Step 1: Pre-compute fingerprints, keywords, bigrams, categories ONCE
  const polyData = polymarkets.map(m => precompute(m))
  const kalshiData = kalshiMarkets.map(m => precompute(m))

  // Step 2/3: Score every poly×kalshi pair. Categories are informational
  // (shown in the UI, used by the event-group phase) but NOT a gate on
  // which pairs get compared — Polymarket and Kalshi each run categorize()
  // independently on differently-phrased text, so the same real-world
  // event can land in different buckets on each side. Bucketing by
  // category would mean that pair is never even scored, which no amount
  // of signal tuning can fix. The actual disambiguation work (entity,
  // topic, date, numeric target) already lives in scorePair, so a full
  // cross product lets those signals do their job on every pair instead
  // of pre-filtering some of them out before they get a chance.
  const catCounts = {}
  for (const d of polyData) {
    if (!catCounts[d.category]) catCounts[d.category] = { poly: 0, kalshi: 0 }
    catCounts[d.category].poly++
  }
  for (const d of kalshiData) {
    if (!catCounts[d.category]) catCounts[d.category] = { poly: 0, kalshi: 0 }
    catCounts[d.category].kalshi++
  }
  console.log(`[matcher] Categories: ${Object.entries(catCounts).map(([c, n]) => `${c}(${n.poly}p/${n.kalshi}k)`).join(', ')}`)

  const candidateMap = new Map()

  for (let pi = 0; pi < polymarkets.length; pi++) {
    for (let ki = 0; ki < kalshiMarkets.length; ki++) {
      const result = scorePair(polymarkets[pi], kalshiMarkets[ki], polyData[pi], kalshiData[ki])
      if (result.score >= MATCH_THRESHOLD) {
        const key = `${pi}:${ki}`
        candidateMap.set(key, { pmIdx: pi, kIdx: ki, score: result.score, reason: result.reason, cat: polyData[pi].category })
      }
    }
  }

  // Step 4.5: Event-group matching — match multi-outcome events (e.g.
  // "NBA Finals Winner") first, then compare only the outcomes within
  // matched event pairs. Purely additive — can only add candidates.
  addEventGroupCandidates(polymarkets, kalshiMarkets, polyData, kalshiData, candidateMap)

  // Diagnostic: candidate count per category, before greedy assignment
  // collapses them down to 1:1. Shows whether low final match count is
  // from candidates being scarce in the first place, or from many
  // candidates existing but concentrating on a small set of indices
  // that greedy assignment can only resolve to one match each.
  if (matchStats) {
    matchStats.candidatesByCategory = {}
    for (const c of candidateMap.values()) {
      matchStats.candidatesByCategory[c.cat] = (matchStats.candidatesByCategory[c.cat] || 0) + 1
    }
    matchStats.uniquePolyInCandidates = new Set([...candidateMap.values()].map(c => c.pmIdx)).size
    matchStats.uniqueKalshiInCandidates = new Set([...candidateMap.values()].map(c => c.kIdx)).size
  }

  // Step 5: Greedy 1:1 assignment — best score wins, tiebreak by edge potential
  const candidates = [...candidateMap.values()]
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    const aEdge = Math.abs(polymarkets[a.pmIdx].prob - kalshiMarkets[a.kIdx].prob)
    const bEdge = Math.abs(polymarkets[b.pmIdx].prob - kalshiMarkets[b.kIdx].prob)
    return bEdge - aEdge
  })

  const usedPoly = new Set()
  const usedKalshi = new Set()
  const matches = []

  for (const c of candidates) {
    if (usedPoly.has(c.pmIdx) || usedKalshi.has(c.kIdx)) continue
    usedPoly.add(c.pmIdx)
    usedKalshi.add(c.kIdx)
    matches.push(buildMatch(polymarkets[c.pmIdx], kalshiMarkets[c.kIdx], c.score, c.reason, polyData[c.pmIdx].category, c.eventTitle))
  }

  // Sort: high-confidence high-edge first
  matches.sort((a, b) => {
    if (a.verified && !b.verified) return -1
    if (!a.verified && b.verified) return 1
    const aWeight = (a.matchConfidence / 100) * a.edge
    const bWeight = (b.matchConfidence / 100) * b.edge
    return bWeight - aWeight
  })

  console.log(`[matcher] ${polymarkets.length} poly × ${kalshiMarkets.length} kalshi → ${candidates.length} candidates → ${matches.length} matches (${matches.filter(m => m.verified).length} verified)`)

  return matches
}

export { categorize } from './fingerprint.js'
