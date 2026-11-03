/**
 * Stage 1 — Deterministic Candidate Blocking
 *
 * Pipeline: Event dedup → Date bucketing → Three blocking passes
 *
 * Structural pre-filters reduce the search space BEFORE blocking:
 *   1. Event dedup: Kalshi multi-candidate events are grouped. Pass 2
 *      matches at the event level, then expands only matched events.
 *   2. Date bucketing: Pairs where both markets have end dates >60 days
 *      apart are skipped before any signal check.
 *
 * Blocking passes (unchanged thresholds):
 *   Pass 1: Token Jaccard overlap ≥ 0.30
 *   Pass 2: Proper-noun co-occurrence via event-level inverted index
 *   Pass 3: Numeric target within 20% AND end dates within 60 days
 */

import { createHash } from 'node:crypto'

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
  'there', 'here', 'also', 'already', 'still', 'even', 'much',
])

const COMMON_STARTS = new Set([
  'will', 'the', 'what', 'who', 'how', 'when', 'where', 'why',
  'before', 'after', 'during', 'between', 'under', 'over',
  'yes', 'no', 'true', 'false', 'all', 'any', 'some', 'none',
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'democratic', 'republican', 'united', 'states', 'american',
  'national', 'federal', 'reserve', 'international',
  'total', 'market', 'price', 'rate', 'level',
  'premier', 'league', 'series', 'cup', 'bowl', 'finals', 'championship',
  'eastern', 'western', 'conference', 'division', 'season',
  'president', 'presidential', 'election', 'nomination',
  'significant', 'increase', 'decrease',
  'chair', 'chairman', 'secretary', 'director', 'governor',
  'next', 'new', 'first', 'last',
])

const COMMON_ACRONYMS = new Set([
  'US', 'USA', 'UK', 'EU', 'UN', 'GDP', 'CPI', 'CEO', 'CFO', 'IPO',
  'API', 'AND', 'THE', 'FOR', 'NOT', 'BUT', 'ARE', 'WAS', 'HAS',
  'YES', 'NO',
])

const DATE_BUCKET_DAYS = 60

function cleanTokens(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w))
}

function jaccard(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0
  let intersection = 0
  for (const item of setA) {
    if (setB.has(item)) intersection++
  }
  const union = setA.size + setB.size - intersection
  return union > 0 ? intersection / union : 0
}

function extractProperNouns(text) {
  const nouns = new Set()

  const multiWord = text.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)*[A-Z][a-z]+)\b/g)
  for (const m of multiWord) {
    const name = m[1].trim().toLowerCase()
    if (!COMMON_STARTS.has(name)) nouns.add(name)
  }

  const singles = text.matchAll(/\b([A-Z][a-z]{3,})\b/g)
  for (const m of singles) {
    if (!COMMON_STARTS.has(m[1].toLowerCase())) nouns.add(m[1].toLowerCase())
  }

  const tickers = text.matchAll(/\$([A-Za-z]{2,6})\b/g)
  for (const m of tickers) nouns.add(m[1].toLowerCase())

  const allCaps = text.matchAll(/\b([A-Z]{2,6})\b/g)
  for (const m of allCaps) {
    if (!COMMON_ACRONYMS.has(m[1])) nouns.add(m[1].toLowerCase())
  }

  const dashMatch = text.match(/\s+-\s+(.{3,})$/)
  if (dashMatch) {
    const candidate = dashMatch[1].trim().toLowerCase()
    nouns.add(candidate)
    const parts = candidate.split(/\s+/)
    if (parts.length >= 2) {
      const surname = parts[parts.length - 1]
      if (surname.length >= 4) nouns.add(surname)
    }
  }

  return nouns
}

function extractNumericTarget(text) {
  const dollarMatch = text.match(/\$\s*([\d,.]+)\s*([KMBkmb])?/i)
  if (dollarMatch) {
    let val = parseFloat(dollarMatch[1].replace(/,/g, ''))
    const suffix = (dollarMatch[2] || '').toUpperCase()
    if (suffix === 'K') val *= 1_000
    if (suffix === 'M') val *= 1_000_000
    if (suffix === 'B') val *= 1_000_000_000
    return val
  }

  const pctMatch = text.match(/([\d.]+)\s*(%|percent)/i)
  if (pctMatch) return parseFloat(pctMatch[1])

  const bpsMatch = text.match(/(\d+)\s*(bps|basis\s+points)/i)
  if (bpsMatch) return parseFloat(bpsMatch[1])

  const numMatch = text.match(/\b(\d{3,})\s*([KMBkmb])?\b/)
  if (numMatch) {
    let val = parseFloat(numMatch[1])
    const suffix = (numMatch[2] || '').toUpperCase()
    if (suffix === 'K') val *= 1_000
    if (suffix === 'M') val *= 1_000_000
    if (suffix === 'B') val *= 1_000_000_000
    if (val >= 100) return val
  }

  return null
}

function parseEndDate(market) {
  if (!market.endDate) return null
  const d = new Date(market.endDate)
  return isNaN(d.getTime()) ? null : d
}

function datesCompatible(dateA, dateB) {
  if (!dateA || !dateB) return true
  const diffDays = Math.abs(dateA - dateB) / (1000 * 60 * 60 * 24)
  return diffDays <= DATE_BUCKET_DAYS
}

export function pairHash(polyQ, kalshiQ) {
  return createHash('sha256').update(`${polyQ}|${kalshiQ}`).digest('hex')
}

/**
 * Groups Kalshi markets by event. Returns a Map of eventKey → { indices, nouns, dates }.
 * For markets without an _eventTitle, each market becomes its own group.
 */
function buildEventGroups(kalshiMarkets, kalshiNouns, kalshiDates) {
  const groups = new Map()
  for (let ki = 0; ki < kalshiMarkets.length; ki++) {
    const eventKey = kalshiMarkets[ki]._eventTitle || `__solo_${ki}`
    if (!groups.has(eventKey)) {
      groups.set(eventKey, { indices: [], nouns: new Set(), minDate: null, maxDate: null })
    }
    const g = groups.get(eventKey)
    g.indices.push(ki)
    for (const noun of kalshiNouns[ki]) {
      g.nouns.add(noun)
    }
    const d = kalshiDates[ki]
    if (d) {
      if (!g.minDate || d < g.minDate) g.minDate = d
      if (!g.maxDate || d > g.maxDate) g.maxDate = d
    }
  }
  return groups
}

/**
 * Check if a Polymarket date is within range of any market in a Kalshi event group.
 * If the group has no dates, allow it through (can't reject without evidence).
 */
function dateCompatibleWithGroup(polyDate, group) {
  if (!polyDate) return true
  if (!group.minDate && !group.maxDate) return true
  const earliest = group.minDate || group.maxDate
  const latest = group.maxDate || group.minDate
  const bufferMs = DATE_BUCKET_DAYS * 24 * 60 * 60 * 1000
  return polyDate.getTime() <= latest.getTime() + bufferMs &&
         polyDate.getTime() >= earliest.getTime() - bufferMs
}

export function generateCandidates(polymarkets, kalshiMarkets) {
  const t0 = Date.now()

  // Pre-compute features
  const polyTokens = polymarkets.map(m => new Set(cleanTokens(m.question)))
  const kalshiTokens = kalshiMarkets.map(m => new Set(cleanTokens(m.question)))
  const polyNouns = polymarkets.map(m => extractProperNouns(m.question))
  const kalshiNouns = kalshiMarkets.map(m => extractProperNouns(m.question))
  const polyTargets = polymarkets.map(m => extractNumericTarget(m.question))
  const kalshiTargets = kalshiMarkets.map(m => extractNumericTarget(m.question))
  const polyDates = polymarkets.map(m => parseEndDate(m))
  const kalshiDates = kalshiMarkets.map(m => parseEndDate(m))

  // Build event groups for Kalshi
  const eventGroups = buildEventGroups(kalshiMarkets, kalshiNouns, kalshiDates)

  const candidates = new Map()
  let pass1 = 0, pass2 = 0, pass3 = 0
  let dateSkipped = 0, eventDeduped = 0

  // ── Pass 1: Token overlap (Jaccard ≥ 0.30) with date gate ──
  for (let pi = 0; pi < polymarkets.length; pi++) {
    if (polyTokens[pi].size === 0) continue
    for (let ki = 0; ki < kalshiMarkets.length; ki++) {
      if (kalshiTokens[ki].size === 0) continue
      if (!datesCompatible(polyDates[pi], kalshiDates[ki])) {
        dateSkipped++
        continue
      }
      if (jaccard(polyTokens[pi], kalshiTokens[ki]) >= 0.30) {
        const key = `${pi}|${ki}`
        if (!candidates.has(key)) candidates.set(key, { pi, ki, signals: [] })
        candidates.get(key).signals.push('token_overlap')
        pass1++
      }
    }
  }

  // ── Pass 2: Proper-noun co-occurrence via EVENT-LEVEL inverted index ──
  // Build noun → event keys index (not noun → individual markets)
  const nounToEvents = new Map()
  for (const [eventKey, group] of eventGroups) {
    for (const noun of group.nouns) {
      if (!nounToEvents.has(noun)) nounToEvents.set(noun, [])
      nounToEvents.get(noun).push(eventKey)
    }
  }

  for (let pi = 0; pi < polymarkets.length; pi++) {
    const pDate = polyDates[pi]

    // Find matching EVENT KEYS via noun overlap
    const matchedEventKeys = new Set()
    for (const noun of polyNouns[pi]) {
      const evKeys = nounToEvents.get(noun)
      if (evKeys) {
        for (const ek of evKeys) matchedEventKeys.add(ek)
      }
    }

    // Expand matched events to individual Kalshi markets
    for (const eventKey of matchedEventKeys) {
      const group = eventGroups.get(eventKey)

      // Date bucket: skip entire event if out of range
      if (!dateCompatibleWithGroup(pDate, group)) {
        eventDeduped += group.indices.length
        continue
      }

      // For multi-market events: only add markets whose nouns
      // actually overlap with the Polymarket nouns (not all siblings)
      for (const ki of group.indices) {
        // Date check at individual market level too
        if (!datesCompatible(pDate, kalshiDates[ki])) {
          dateSkipped++
          continue
        }

        // Require the individual market to share at least one noun
        let hasSharedNoun = false
        for (const noun of polyNouns[pi]) {
          if (kalshiNouns[ki].has(noun)) {
            hasSharedNoun = true
            break
          }
        }
        if (!hasSharedNoun) {
          eventDeduped++
          continue
        }

        const key = `${pi}|${ki}`
        if (!candidates.has(key)) {
          candidates.set(key, { pi, ki, signals: [] })
          pass2++
        }
        const c = candidates.get(key)
        if (!c.signals.includes('proper_noun')) c.signals.push('proper_noun')
      }
    }
  }

  // ── Pass 3: Numeric + temporal proximity (date gate built in) ──
  for (let pi = 0; pi < polymarkets.length; pi++) {
    const pTarget = polyTargets[pi]
    if (pTarget == null) continue
    const pDate = polyDates[pi]

    for (let ki = 0; ki < kalshiMarkets.length; ki++) {
      const kTarget = kalshiTargets[ki]
      if (kTarget == null) continue

      const ratio = Math.min(pTarget, kTarget) / Math.max(pTarget, kTarget)
      if (ratio < 0.80) continue

      if (!datesCompatible(pDate, kalshiDates[ki])) continue

      const key = `${pi}|${ki}`
      if (!candidates.has(key)) {
        candidates.set(key, { pi, ki, signals: [] })
        pass3++
      }
      const c = candidates.get(key)
      if (!c.signals.includes('numeric_temporal')) c.signals.push('numeric_temporal')
    }
  }

  const result = [...candidates.values()]
  const elapsed = Date.now() - t0

  console.log(
    `[blocker] ${polymarkets.length} poly × ${kalshiMarkets.length} kalshi → ` +
    `${result.length} candidates (pass1=${pass1} pass2=${pass2} pass3=${pass3}) ` +
    `dateSkipped=${dateSkipped} eventDeduped=${eventDeduped} ` +
    `events=${eventGroups.size} in ${elapsed}ms`
  )

  return result
}
