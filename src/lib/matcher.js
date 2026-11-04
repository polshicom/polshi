/**
 * Category-first market matcher.
 *
 * Strategy: categorize → match within categories → compute arb.
 * This finds ALL matching markets first, then calculates edge after.
 *
 * 1. Categorize every market on both platforms
 * 2. Within each category, compare Poly vs Kalshi using text similarity
 * 3. Score matches by keyword overlap + entity overlap
 * 4. Greedy 1:1 assignment (best match wins)
 * 5. Build result with edge/arb calculations
 */

import { categorize } from './fingerprint.js'

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
  const descWords = normalizeText(desc).slice(0, 8)
  const set = new Set(qWords)
  for (const w of descWords) set.add(w)
  return set
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

function extractYear(text) {
  const m = text.match(/\b(20[2-3]\d)\b/)
  return m ? m[1] : null
}

function extractMonth(text) {
  const months = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
    january: 1, february: 2, march: 3, april: 4, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 }
  const m = text.toLowerCase().match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/)
  return m ? months[m[1]] : null
}

function extractNumericTarget(text) {
  const dollar = text.match(/\$\s*([\d,.]+)\s*([KMBkmb])?/)
  if (dollar) {
    let val = parseFloat(dollar[1].replace(/,/g, ''))
    const s = (dollar[2] || '').toUpperCase()
    if (s === 'K') val *= 1_000
    if (s === 'M') val *= 1_000_000
    if (s === 'B') val *= 1_000_000_000
    return val
  }
  const pct = text.match(/([\d.]+)\s*(%|percent)/i)
  if (pct) return parseFloat(pct[1])
  const bps = text.match(/(\d+)\s*(bps|basis\s+points)/i)
  if (bps) return parseFloat(bps[1])
  return null
}

function detectPolarity(text) {
  if (/\bnot\b|\bwon't\b|\bwill\s+not\b|\bfail\s+to\b|\bnever\b/i.test(text)) return 'negative'
  return 'positive'
}

// ── Kalshi Sub-market Gate ──────────────────────────

function extractKalshiAnswer(question) {
  const dashIdx = question.lastIndexOf(' - ')
  if (dashIdx === -1 || dashIdx < 10) return null
  return question.slice(dashIdx + 3).trim().toLowerCase()
}

function questionContainsAnswer(question, answer) {
  const qLower = question.toLowerCase()
  if (qLower.includes(answer)) return true
  const words = answer.split(/\s+/).filter(w => w.length >= 3)
  return words.length > 0 && words.every(w => qLower.includes(w))
}

// ── Pair Scoring ────────────────────────────────────
// Scores how likely two markets are the same event.
// Returns 0-100, higher = more likely same market.

function scorePair(pm, km) {
  const pmQ = pm.question || ''
  const kmQ = km.question || ''

  // Kalshi sub-market gate
  const kAnswer = extractKalshiAnswer(kmQ)
  if (kAnswer && !questionContainsAnswer(pmQ, kAnswer)) return { score: 0, reason: 'sub-market mismatch' }

  const pmKeywords = getKeywords(pm)
  const kmKeywords = getKeywords(km)

  // Core text similarity
  const jaccard = jaccardSimilarity(pmKeywords, kmKeywords)
  const overlap = overlapCoefficient(pmKeywords, kmKeywords)
  const textScore = (jaccard * 0.4 + overlap * 0.6) * 60

  let bonus = 0
  let penalty = 0
  const reasons = []

  // Year check
  const pmYear = extractYear(pmQ)
  const kmYear = extractYear(kmQ)
  if (pmYear && kmYear) {
    if (pmYear === kmYear) { bonus += 8; reasons.push('same year') }
    else { penalty += 20; reasons.push('diff year') }
  }

  // Month check
  const pmMonth = extractMonth(pmQ)
  const kmMonth = extractMonth(kmQ)
  if (pmMonth && kmMonth) {
    if (pmMonth === kmMonth) { bonus += 5; reasons.push('same month') }
    else { penalty += 10; reasons.push('diff month') }
  }

  // Numeric target check
  const pmTarget = extractNumericTarget(pmQ)
  const kmTarget = extractNumericTarget(kmQ)
  if (pmTarget != null && kmTarget != null) {
    const ratio = Math.min(pmTarget, kmTarget) / Math.max(pmTarget, kmTarget)
    if (ratio >= 0.9) { bonus += 12; reasons.push('same target') }
    else if (ratio < 0.5) { penalty += 15; reasons.push('diff target') }
  }

  // Polarity check
  if (detectPolarity(pmQ) !== detectPolarity(kmQ)) {
    penalty += 15
    reasons.push('polarity mismatch')
  }

  // End date proximity bonus
  if (pm.endDate && km.endDate) {
    const pmDate = new Date(pm.endDate)
    const kmDate = new Date(km.endDate)
    if (!isNaN(pmDate) && !isNaN(kmDate)) {
      const diffDays = Math.abs(pmDate - kmDate) / (1000 * 60 * 60 * 24)
      if (diffDays <= 3) { bonus += 10; reasons.push('same end date') }
      else if (diffDays <= 14) { bonus += 5; reasons.push('close end date') }
      else if (diffDays > 60) { penalty += 8; reasons.push('far end dates') }
    }
  }

  // Shared proper names bonus (beyond keyword overlap)
  const pmNames = extractProperNames(pmQ)
  const kmNames = extractProperNames(kmQ)
  if (pmNames.size > 0 && kmNames.size > 0) {
    let nameOverlap = 0
    for (const n of pmNames) {
      if (kmNames.has(n)) nameOverlap++
      for (const kn of kmNames) {
        if (n !== kn && (n.includes(kn) || kn.includes(n))) nameOverlap++
      }
    }
    if (nameOverlap > 0) { bonus += 15; reasons.push(`${nameOverlap} shared names`) }
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(textScore + bonus - penalty)))
  return {
    score: finalScore,
    reason: `text=${(textScore).toFixed(0)} +${bonus} -${penalty} [${reasons.join(', ')}]`,
    jaccard: Math.round(jaccard * 100),
    overlap: Math.round(overlap * 100),
  }
}

// ── Proper Name Extraction ──────────────────────────

function extractProperNames(text) {
  const names = new Set()
  const skip = new Set([
    'will', 'what', 'which', 'before', 'after', 'during', 'between',
    'under', 'over', 'next', 'first', 'last', 'prime', 'minister',
    'president', 'governor', 'chancellor', 'secretary', 'general',
    'election', 'party', 'democratic', 'republican', 'house', 'senate',
    'january', 'february', 'march', 'april', 'june', 'july', 'august',
    'september', 'october', 'november', 'december', 'actor', 'film',
    'championship', 'premier', 'league', 'series', 'cup', 'bowl',
    'finals', 'conference', 'division', 'season', 'total', 'market',
    'price', 'rate', 'level', 'much', 'new', 'united', 'states',
    'national', 'federal', 'reserve', 'international', 'significant',
  ])

  // Multi-word capitalized
  const multi = text.matchAll(/\b([A-Z][a-z]+(?:\s+(?:[A-Z]\.?\s*)?[A-Z][a-z]+)+)\b/g)
  for (const m of multi) {
    const name = m[1].trim().toLowerCase()
    if (!skip.has(name)) names.add(name)
  }

  // Single caps 4+ chars
  const singles = text.matchAll(/\b([A-Z][a-z]{3,})\b/g)
  for (const m of singles) {
    const w = m[1].toLowerCase()
    if (!skip.has(w)) names.add(w)
  }

  // Tickers/acronyms
  const tickers = text.matchAll(/\b([A-Z]{2,6})\b/g)
  for (const m of tickers) {
    const t = m[1].toLowerCase()
    if (!skip.has(t) && t.length >= 3) names.add(t)
  }

  return names
}

// ── Build Match Entry ────────────────────────────────

function buildMatch(pm, km, score, reason) {
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

const MATCH_THRESHOLD = 30

export function matchMarkets(polymarkets, kalshiMarkets) {
  // Step 1: Categorize all markets
  const polyByCategory = {}
  const kalshiByCategory = {}

  for (let i = 0; i < polymarkets.length; i++) {
    const cat = categorize(polymarkets[i].question)
    if (!polyByCategory[cat]) polyByCategory[cat] = []
    polyByCategory[cat].push(i)
  }

  for (let i = 0; i < kalshiMarkets.length; i++) {
    const cat = categorize(kalshiMarkets[i].question)
    if (!kalshiByCategory[cat]) kalshiByCategory[cat] = []
    kalshiByCategory[cat].push(i)
  }

  const allCategories = new Set([...Object.keys(polyByCategory), ...Object.keys(kalshiByCategory)])
  console.log(`[matcher] Categories: ${[...allCategories].map(c => `${c}(${(polyByCategory[c]||[]).length}p/${(kalshiByCategory[c]||[]).length}k)`).join(', ')}`)

  // Step 2: Within each category, score all cross-platform pairs
  const candidates = []

  for (const cat of allCategories) {
    const polyIndices = polyByCategory[cat] || []
    const kalshiIndices = kalshiByCategory[cat] || []
    if (polyIndices.length === 0 || kalshiIndices.length === 0) continue

    for (const pi of polyIndices) {
      for (const ki of kalshiIndices) {
        const result = scorePair(polymarkets[pi], kalshiMarkets[ki])
        if (result.score >= MATCH_THRESHOLD) {
          candidates.push({ pmIdx: pi, kIdx: ki, score: result.score, reason: result.reason, cat })
        }
      }
    }
  }

  // Step 3: Also try cross-category matching for "Other" bucket
  // Markets miscategorized on one platform might match correctly on the other
  const otherPoly = polyByCategory['Other'] || []
  const otherKalshi = kalshiByCategory['Other'] || []

  // Match "Other" poly against ALL kalshi categories
  for (const pi of otherPoly) {
    for (let ki = 0; ki < kalshiMarkets.length; ki++) {
      const result = scorePair(polymarkets[pi], kalshiMarkets[ki])
      if (result.score >= MATCH_THRESHOLD + 10) {
        candidates.push({ pmIdx: pi, kIdx: ki, score: result.score, reason: result.reason, cat: 'cross' })
      }
    }
  }

  // Match "Other" kalshi against ALL poly categories
  for (const ki of otherKalshi) {
    for (let pi = 0; pi < polymarkets.length; pi++) {
      const result = scorePair(polymarkets[pi], kalshiMarkets[ki])
      if (result.score >= MATCH_THRESHOLD + 10) {
        candidates.push({ pmIdx: pi, kIdx: ki, score: result.score, reason: result.reason, cat: 'cross' })
      }
    }
  }

  // Deduplicate candidates (same pair might appear from category + cross matching)
  const seen = new Set()
  const dedupedCandidates = []
  for (const c of candidates) {
    const key = `${c.pmIdx}:${c.kIdx}`
    if (!seen.has(key)) {
      seen.add(key)
      dedupedCandidates.push(c)
    }
  }

  // Step 4: Greedy 1:1 assignment — best score wins
  dedupedCandidates.sort((a, b) => b.score - a.score)

  const usedPoly = new Set()
  const usedKalshi = new Set()
  const matches = []

  for (const c of dedupedCandidates) {
    if (usedPoly.has(c.pmIdx) || usedKalshi.has(c.kIdx)) continue
    usedPoly.add(c.pmIdx)
    usedKalshi.add(c.kIdx)
    matches.push(buildMatch(polymarkets[c.pmIdx], kalshiMarkets[c.kIdx], c.score, c.reason))
  }

  // Sort: verified first, then by edge desc
  matches.sort((a, b) => {
    if (a.verified && !b.verified) return -1
    if (!a.verified && b.verified) return 1
    return (b.edge ?? -1) - (a.edge ?? -1)
  })

  console.log(`[matcher] ${polymarkets.length} poly × ${kalshiMarkets.length} kalshi → ${dedupedCandidates.length} candidates → ${matches.length} matches (${matches.filter(m => m.verified).length} verified)`)

  return matches
}

export { categorize } from './fingerprint.js'
