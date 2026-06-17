/**
 * AI Verification Layer — secondary referee for market matches.
 *
 * Runs AFTER the fingerprint-based rule matching to provide a second
 * opinion on whether two markets resolve under the same conditions.
 *
 * Scoring:
 *   confidence >= 90 → verified (trusted)
 *   confidence 70-89 → possible match (display with warning)
 *   confidence < 70  → reject
 *
 * This module uses structured feature comparison (no external API).
 * It focuses on detecting subtle mismatches that rule-based matching
 * might miss: different resolution criteria, inverted outcomes,
 * related-but-different events.
 */

// ── Proper Name Extraction (from raw text) ───────────

const COMMON_WORDS = new Set([
  'Will', 'The', 'What', 'Who', 'How', 'When', 'Where', 'Why',
  'Before', 'After', 'During', 'Between', 'Under', 'Over',
  'Yes', 'No', 'True', 'False', 'All', 'Any', 'Some', 'None',
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'Democratic', 'Republican', 'United', 'States', 'American',
  'National', 'Federal', 'Reserve', 'International',
  'Total', 'Market', 'Price', 'Rate', 'Level',
  'Premier', 'League', 'Series', 'Cup', 'Bowl', 'Finals', 'Championship',
  'Eastern', 'Western', 'Conference', 'Division', 'Season',
  'President', 'Presidential', 'Election', 'Nomination',
  'Significant', 'Increase', 'Decrease',
  'Chair', 'Chairman', 'Secretary', 'Director', 'Governor',
  'Next', 'New', 'First', 'Last', 'Much',
])

function extractProperNames(text) {
  const names = new Set()
  // Multi-word names (First Last)
  const multiWord = text.matchAll(/\b([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:[A-Z][a-z]+)?)\b/g)
  for (const m of multiWord) {
    const name = m[1].trim()
    if (COMMON_WORDS.has(name)) continue
    if (name.split(/\s+/).length >= 2 || name.length >= 4) {
      names.add(name.toLowerCase())
    }
  }
  // Single capitalized words (4+ chars)
  const singles = text.matchAll(/\b([A-Z][a-z]{3,})\b/g)
  for (const m of singles) {
    if (!COMMON_WORDS.has(m[1])) {
      names.add(m[1].toLowerCase())
    }
  }
  return names
}

// ── Feature Extractors ───────────────────────────────

function extractYears(text) {
  const years = new Set()
  const matches = text.matchAll(/\b(20[2-3]\d)\b/g)
  for (const m of matches) years.add(m[1])
  return years
}

function extractMonths(text) {
  const months = new Set()
  const monthNames = /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/gi
  const matches = text.matchAll(monthNames)
  for (const m of matches) months.add(m[1].toLowerCase().substring(0, 3))
  return months
}

function extractTargets(text) {
  const targets = new Set()
  const priceMatches = text.matchAll(/\$[\d,.]+[KMB]?/g)
  for (const m of priceMatches) targets.add(m[0].toLowerCase())
  const bpsMatches = text.matchAll(/\d+\+?\s*bps/gi)
  for (const m of bpsMatches) targets.add(m[0].toLowerCase())
  const pctMatches = text.matchAll(/\d+\.?\d*\s*(%|percent|degrees)/gi)
  for (const m of pctMatches) targets.add(m[0].toLowerCase())
  return targets
}

// ── Action Detection (question-level) ────────────────

const ACTION_CATEGORIES = [
  { action: 'nominate',  patterns: [/\bnominat\w*/i, /\bnominee\b/i] },
  { action: 'run',       patterns: [/\brun for\b/i, /\brun in the\b/i, /\brunning for\b/i, /\benter.{0,10}race\b/i, /\bcandidat\w*/i, /\bseek.{0,10}(presidency|nomination|office)\b/i] },
  { action: 'win',       patterns: [/\bwin\b/i, /\bwinner\b/i, /\bchampion\b/i, /\bwon\b/i] },
  { action: 'elect',     patterns: [/\belect\w*/i] },
  { action: 'cut',       patterns: [/\b(cut|decrease|lower|reduc)\w*\b/i] },
  { action: 'hike',      patterns: [/\b(hike|increase|raise)\w*\b/i] },
  { action: 'acquire',   patterns: [/\b(acquir|merger|merg|buyout|takeover)\w*/i] },
  { action: 'ipo',       patterns: [/\bIPO\b/i, /\bgo\s+public\b/i] },
  { action: 'resign',    patterns: [/\b(resign|step down|leave office|quit)\b/i] },
  { action: 'impeach',   patterns: [/\bimpeach\w*/i] },
  { action: 'bankrupt',  patterns: [/\b(default|bankrupt)\w*/i] },
  { action: 'launch',    patterns: [/\b(launch|deliver|release|ship|deploy)\b/i] },
  { action: 'reach',     patterns: [/\b(reach|hit|exceed|pass|surpass)\b/i] },
  { action: 'land',      patterns: [/\b(land on|visit|orbit)\b/i] },
  { action: 'fall',      patterns: [/\b(fall|collapse|overthrow)\b/i] },
  { action: 'ban',       patterns: [/\b(ban|prohibit|outlaw)\w*/i] },
  { action: 'relegate',  patterns: [/\b(relegate|relegation)\w*/i] },
  { action: 'promote',   patterns: [/\b(promot)\w*\b/i] },
  { action: 'transfer',  patterns: [/\b(transfer|sign|signing)\b/i] },
]

const CONFLICTING_ACTIONS = new Set([
  'nominate|run', 'run|nominate',
  'nominate|win', 'win|nominate',
  'nominate|elect', 'elect|nominate',
  'run|win', 'win|run',
  'run|elect', 'elect|run',
  'cut|hike', 'hike|cut',
  'acquire|ipo', 'ipo|acquire',
  'resign|impeach', 'impeach|resign',
  'launch|land', 'land|launch',
  'reach|fall', 'fall|reach',
  'relegate|promote', 'promote|relegate',
  'relegate|win', 'win|relegate',
])

function extractActions(text) {
  const actions = new Set()
  for (const { action, patterns } of ACTION_CATEGORIES) {
    for (const p of patterns) {
      if (p.test(text)) { actions.add(action); break }
    }
  }
  // Compound phrase cleanup
  if (actions.has('win') && actions.has('nominate')) actions.delete('win')
  if (actions.has('win') && actions.has('elect')) actions.delete('win')
  if (actions.has('win') && /\bwin\b.{0,30}\b(nominat|primary)\b/i.test(text)) {
    actions.delete('win')
    actions.add('nominate')
  }
  if (actions.has('run') && actions.has('elect')) actions.delete('elect')
  return actions
}

function actionsConflict(actionsA, actionsB) {
  for (const a of actionsA) {
    for (const b of actionsB) {
      if (CONFLICTING_ACTIONS.has(`${a}|${b}`)) return true
    }
  }
  return false
}

// ── Context Extraction ───────────────────────────────

const CONTEXT_PATTERNS = {
  presidential: /\bpresidenti\w*\b/i,
  fed:          /\b(fed|federal reserve|fomc|interest rate)\b/i,
  fed_chair:    /\b(fed\s*chair|federal reserve\s*chair)\b/i,
  congress:     /\b(congress|senate|house)\b/i,
  crypto:       /\b(bitcoin|btc|ethereum|eth|crypto)\b/i,
  nba:          /\b(nba|basketball)\b/i,
  nfl:          /\b(nfl|football|super bowl)\b/i,
  mlb:          /\b(mlb|baseball|world series)\b/i,
  nhl:          /\b(nhl|hockey|stanley cup)\b/i,
  soccer:       /\b(premier league|champions league|la liga|serie a|bundesliga|mls|fifa|uefa)\b/i,
  tech:         /\b(spacex|tesla|apple|google|microsoft|openai)\b/i,
  climate:      /\b(climate|temperature|degrees|warming)\b/i,
  recession:    /\b(recession|gdp|economy|economic)\b/i,
  war:          /\b(war|invasion|military|regime|ceasefire)\b/i,
  greenland:    /\bgreenland\b/i,
}

function extractContexts(text) {
  const contexts = new Set()
  for (const [ctx, pattern] of Object.entries(CONTEXT_PATTERNS)) {
    if (pattern.test(text)) contexts.add(ctx)
  }
  return contexts
}

// ── Set Overlap Helper ───────────────────────────────

function computeSetOverlap(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return { overlap: 0, total: 0, ratio: 1 }
  let overlap = 0
  for (const item of setA) {
    if (setB.has(item)) overlap++
  }
  const total = Math.max(setA.size, setB.size)
  return { overlap, total, ratio: total > 0 ? overlap / total : 0 }
}

function fuzzyNameOverlap(setA, setB) {
  for (const a of setA) {
    for (const b of setB) {
      const aLast = a.split(/\s+/).pop()
      const bLast = b.split(/\s+/).pop()
      if (aLast.length >= 4 && aLast === bLast) return true
      if (a.includes(b) || b.includes(a)) return true
    }
  }
  return false
}

// ── Main Scoring ─────────────────────────────────────
// This runs on candidate pairs that already passed rule-based matching.
// Its job is to catch subtle issues the rules might miss.

function verifyPair(polyQ, kalshiQ, polyDesc, kalshiDesc, fpPoly, fpKalshi) {
  const pFull = polyDesc ? `${polyQ} ${polyDesc}` : polyQ
  const kFull = kalshiDesc ? `${kalshiQ} ${kalshiDesc}` : kalshiQ

  const pNames    = extractProperNames(pFull)
  const kNames    = extractProperNames(kFull)
  const pYears    = extractYears(pFull)
  const kYears    = extractYears(kFull)
  const pMonths   = extractMonths(pFull)
  const kMonths   = extractMonths(kFull)
  const pActions  = extractActions(polyQ)
  const kActions  = extractActions(kalshiQ)
  const pContexts = extractContexts(pFull)
  const kContexts = extractContexts(kFull)
  const pTargets  = extractTargets(pFull)
  const kTargets  = extractTargets(kFull)

  let score = 50
  const reasons = []

  // 1. ENTITY CHECK — use fingerprints for primary subjects
  if (fpPoly && fpKalshi && fpPoly.entity && fpKalshi.entity) {
    const pEntity = fpPoly.entity.toLowerCase()
    const kEntity = fpKalshi.entity.toLowerCase()
    if (pEntity === kEntity || pEntity.includes(kEntity) || kEntity.includes(pEntity)) {
      score += 15
      reasons.push('Same primary entity')
    } else {
      score -= 35
      reasons.push(`Different primary entities (${fpPoly.entity} vs ${fpKalshi.entity})`)
    }
  }

  // 2. NAMES — general entity overlap
  if (pNames.size > 0 && kNames.size > 0) {
    if (computeSetOverlap(pNames, kNames).ratio >= 0.5 || fuzzyNameOverlap(pNames, kNames)) {
      score += 15
      reasons.push('Name overlap')
    } else {
      score -= 25
      reasons.push('Different entities in text')
    }
  } else if (pNames.size > 0 || kNames.size > 0) {
    score -= 10
    reasons.push('Entity mismatch')
  }

  // 3. ACTIONS — critical check
  if (pActions.size > 0 && kActions.size > 0) {
    if (actionsConflict(pActions, kActions)) {
      score -= 50
      reasons.push(`Action conflict (${[...pActions].join('/')} vs ${[...kActions].join('/')})`)
    } else if (computeSetOverlap(pActions, kActions).overlap > 0) {
      score += 15
      reasons.push('Same action')
    } else {
      score -= 15
      reasons.push('Different actions')
    }
  } else if (pActions.size > 0 || kActions.size > 0) {
    const detectedActions = pActions.size > 0 ? pActions : kActions
    const hasPoliticalAction = detectedActions.has('run') || detectedActions.has('win') ||
                               detectedActions.has('nominate') || detectedActions.has('elect')
    if (hasPoliticalAction) {
      score -= 20
      reasons.push(`Action missing on one side (${[...detectedActions].join('/')})`)
    } else {
      score -= 8
      reasons.push('Action unclear')
    }
  }

  // 4. YEAR
  if (pYears.size > 0 && kYears.size > 0) {
    if (computeSetOverlap(pYears, kYears).ratio >= 1) {
      score += 10
      reasons.push('Same year')
    } else {
      score -= 15
      reasons.push('Different year')
    }
  }

  // 5. MONTH
  if (pMonths.size > 0 && kMonths.size > 0) {
    if (computeSetOverlap(pMonths, kMonths).overlap > 0) {
      score += 5
      reasons.push('Same month')
    } else {
      score -= 8
      reasons.push('Different month')
    }
  }

  // 6. CONTEXT
  if (pContexts.size > 0 && kContexts.size > 0) {
    if (computeSetOverlap(pContexts, kContexts).overlap > 0) {
      score += 5
      reasons.push('Same context')
    } else {
      score -= 10
      reasons.push('Different context')
    }
  }

  // 7. TARGETS
  if (pTargets.size > 0 && kTargets.size > 0) {
    if (computeSetOverlap(pTargets, kTargets).overlap > 0) {
      score += 10
      reasons.push('Same target')
    } else {
      score -= 10
      reasons.push('Different target')
    }
  }

  // 8. QUESTION STRUCTURE
  const pWords = polyQ.split(/\s+/).length
  const kWords = kalshiQ.split(/\s+/).length
  const lenRatio = Math.min(pWords, kWords) / Math.max(pWords, kWords)
  if (lenRatio < 0.4) {
    score -= 5
    reasons.push('Different question structure')
  }

  // 9. DESCRIPTION CROSS-CHECK
  if (polyDesc && kalshiDesc) {
    const pDescNames = extractProperNames(polyDesc)
    const kDescNames = extractProperNames(kalshiDesc)
    if (pDescNames.size > 0 && kDescNames.size > 0) {
      if (fuzzyNameOverlap(pDescNames, kDescNames)) {
        score += 10
        reasons.push('Rules mention same entities')
      } else if (computeSetOverlap(pDescNames, kDescNames).ratio === 0) {
        score -= 10
        reasons.push('Rules mention different entities')
      }
    }
    const pDescTargets = extractTargets(polyDesc)
    const kDescTargets = extractTargets(kalshiDesc)
    if (pDescTargets.size > 0 && kDescTargets.size > 0) {
      if (computeSetOverlap(pDescTargets, kDescTargets).overlap > 0) {
        score += 5
        reasons.push('Rules share numeric targets')
      } else {
        score -= 5
        reasons.push('Rules have different targets')
      }
    }
  }

  // 10. POLARITY CHECK — use fingerprints
  if (fpPoly && fpKalshi && fpPoly.polarity !== fpKalshi.polarity) {
    score -= 20
    reasons.push(`Polarity mismatch: ${fpPoly.polarity} vs ${fpKalshi.polarity}`)
  }

  score = Math.max(0, Math.min(100, score))

  return {
    aiConfidence: score,
    aiReason: reasons.join(', '),
  }
}

// ── Public API ───────────────────────────────────────

export async function aiVerifyMatches(matches) {
  const results = new Map()

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i]
    const polyQ = m.question || ''
    const kalshiQ = m._kalshiQuestion || ''
    if (!polyQ || !kalshiQ) continue
    const polyDesc = m._polyDescription || ''
    const kalshiDesc = m._kalshiDescription || ''
    const fpPoly = m._fingerprints?.polymarket || null
    const fpKalshi = m._fingerprints?.kalshi || null
    results.set(i, verifyPair(polyQ, kalshiQ, polyDesc, kalshiDesc, fpPoly, fpKalshi))
  }

  return results
}
