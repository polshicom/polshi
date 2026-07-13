/**
 * Market Fingerprinting — structured feature extraction for safe matching.
 *
 * Instead of fuzzy string comparison, we extract a structured fingerprint
 * from each market and compare fields independently. This prevents false
 * matches where two markets share keywords but resolve under completely
 * different conditions.
 */

// ── Stopwords ───────────────────────────────────────
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
])

// ── Entity Extraction ───────────────────────────────

// Known entities — politicians, companies, crypto, teams, people
const KNOWN_ENTITIES = [
  // Politicians
  { pattern: /\b(Donald\s+Trump|Trump)\b/i, canonical: 'Donald Trump' },
  { pattern: /\b(Barron\s+Trump)\b/i, canonical: 'Barron Trump' },
  { pattern: /\b(Joe\s+Biden|Biden)\b/i, canonical: 'Joe Biden' },
  { pattern: /\b(Kamala\s+Harris|Harris)\b/i, canonical: 'Kamala Harris' },
  { pattern: /\b(J\.?D\.?\s+Vance|Vance)\b/i, canonical: 'JD Vance' },
  { pattern: /\b(Ron\s+DeSantis|DeSantis)\b/i, canonical: 'Ron DeSantis' },
  { pattern: /\b(Nikki\s+Haley|Haley)\b/i, canonical: 'Nikki Haley' },
  { pattern: /\b(Vivek\s+Ramaswamy|Ramaswamy)\b/i, canonical: 'Vivek Ramaswamy' },
  { pattern: /\b(Gavin\s+Newsom|Newsom)\b/i, canonical: 'Gavin Newsom' },
  { pattern: /\b(Robert\s+F\.?\s*Kennedy|RFK|Kennedy)\b/i, canonical: 'RFK' },
  { pattern: /\b(Michelle\s+Obama)\b/i, canonical: 'Michelle Obama' },
  { pattern: /\b(Pete\s+Buttigieg|Buttigieg)\b/i, canonical: 'Pete Buttigieg' },
  { pattern: /\b(Tim\s+Walz|Walz)\b/i, canonical: 'Tim Walz' },
  { pattern: /\b(Elon\s+Musk|Musk)\b/i, canonical: 'Elon Musk' },
  { pattern: /\b(Jerome\s+Powell|Powell)\b/i, canonical: 'Jerome Powell' },
  { pattern: /\b(Mark\s+Kelly|Kelly)\b/i, canonical: 'Mark Kelly' },
  { pattern: /\b(Josh\s+Shapiro|Shapiro)\b/i, canonical: 'Josh Shapiro' },
  { pattern: /\b(Gretchen\s+Whitmer|Whitmer)\b/i, canonical: 'Gretchen Whitmer' },
  { pattern: /\b(Bernie\s+Sanders|Sanders)\b/i, canonical: 'Bernie Sanders' },
  { pattern: /\b(Marco\s+Rubio|Rubio)\b/i, canonical: 'Marco Rubio' },
  { pattern: /\b(Tucker\s+Carlson|Carlson)\b/i, canonical: 'Tucker Carlson' },
  { pattern: /\b(Volodymyr\s+Zelensky|Zelensky|Zelenskyy)\b/i, canonical: 'Zelensky' },
  { pattern: /\b(Vladimir\s+Putin|Putin)\b/i, canonical: 'Putin' },
  { pattern: /\b(Xi\s+Jinping|Xi)\b/i, canonical: 'Xi Jinping' },
  { pattern: /\b(Benjamin\s+Netanyahu|Netanyahu)\b/i, canonical: 'Netanyahu' },
  // Companies / Orgs
  { pattern: /\b(Tesla|TSLA)\b/i, canonical: 'Tesla' },
  { pattern: /\b(SpaceX)\b/i, canonical: 'SpaceX' },
  { pattern: /\b(Apple|AAPL)\b/i, canonical: 'Apple' },
  { pattern: /\b(Google|Alphabet|GOOG)\b/i, canonical: 'Google' },
  { pattern: /\b(Microsoft|MSFT)\b/i, canonical: 'Microsoft' },
  { pattern: /\b(Amazon|AMZN)\b/i, canonical: 'Amazon' },
  { pattern: /\b(Meta)\b/i, canonical: 'Meta' },
  { pattern: /\b(Nvidia|NVDA)\b/i, canonical: 'Nvidia' },
  { pattern: /\b(OpenAI)\b/i, canonical: 'OpenAI' },
  { pattern: /\b(TikTok)\b/i, canonical: 'TikTok' },
  // Crypto
  { pattern: /\b(Bitcoin|BTC)\b/i, canonical: 'Bitcoin' },
  { pattern: /\b(Ethereum|ETH)\b/i, canonical: 'Ethereum' },
  { pattern: /\b(Solana|SOL)\b/i, canonical: 'Solana' },
  { pattern: /\b(Dogecoin|DOGE)\b/i, canonical: 'Dogecoin' },
  { pattern: /\b(XRP|Ripple)\b/i, canonical: 'XRP' },
  // Institutions
  { pattern: /\b(Federal Reserve|the Fed|Fed(?:eral)?)\b/i, canonical: 'Fed' },
  { pattern: /\b(FOMC)\b/i, canonical: 'Fed' },
  { pattern: /\b(NATO)\b/i, canonical: 'NATO' },
  { pattern: /\b(European Union|EU)\b/i, canonical: 'EU' },
  // Sports teams — NBA
  { pattern: /\b(Lakers)\b/i, canonical: 'Lakers' },
  { pattern: /\b(Celtics)\b/i, canonical: 'Celtics' },
  { pattern: /\b(Warriors)\b/i, canonical: 'Warriors' },
  { pattern: /\b(Knicks)\b/i, canonical: 'Knicks' },
  { pattern: /\b(76ers|Sixers)\b/i, canonical: '76ers' },
  { pattern: /\b(Bucks)\b/i, canonical: 'Bucks' },
  { pattern: /\b(Heat)\b/i, canonical: 'Heat' },
  { pattern: /\b(Nuggets)\b/i, canonical: 'Nuggets' },
  { pattern: /\b(Suns)\b/i, canonical: 'Suns' },
  { pattern: /\b(Mavericks)\b/i, canonical: 'Mavericks' },
  { pattern: /\b(Thunder)\b/i, canonical: 'Thunder' },
  { pattern: /\b(Timberwolves)\b/i, canonical: 'Timberwolves' },
  { pattern: /\b(Cavaliers|Cavs)\b/i, canonical: 'Cavaliers' },
  { pattern: /\b(Pacers)\b/i, canonical: 'Pacers' },
  // Sports teams — NFL
  { pattern: /\b(Chiefs)\b/i, canonical: 'Chiefs' },
  { pattern: /\b(Eagles)\b/i, canonical: 'Eagles' },
  { pattern: /\b(49ers)\b/i, canonical: '49ers' },
  { pattern: /\b(Cowboys)\b/i, canonical: 'Cowboys' },
  { pattern: /\b(Ravens)\b/i, canonical: 'Ravens' },
  { pattern: /\b(Bills)\b/i, canonical: 'Bills' },
  { pattern: /\b(Lions)\b/i, canonical: 'Lions' },
  { pattern: /\b(Dolphins)\b/i, canonical: 'Dolphins' },
  { pattern: /\b(Bengals)\b/i, canonical: 'Bengals' },
  { pattern: /\b(Packers)\b/i, canonical: 'Packers' },
  { pattern: /\b(Steelers)\b/i, canonical: 'Steelers' },
  // Sports teams — MLB
  { pattern: /\b(Yankees)\b/i, canonical: 'Yankees' },
  { pattern: /\b(Dodgers)\b/i, canonical: 'Dodgers' },
  { pattern: /\b(Braves)\b/i, canonical: 'Braves' },
  { pattern: /\b(Astros)\b/i, canonical: 'Astros' },
  { pattern: /\b(Phillies)\b/i, canonical: 'Phillies' },
  { pattern: /\b(Mets)\b/i, canonical: 'Mets' },
  // Sports teams — NHL
  { pattern: /\b(Oilers)\b/i, canonical: 'Oilers' },
  { pattern: /\b(Panthers)\b/i, canonical: 'Panthers' },
  { pattern: /\b(Maple\s+Leafs)\b/i, canonical: 'Maple Leafs' },
  { pattern: /\b(Canadiens)\b/i, canonical: 'Canadiens' },
  // Soccer
  { pattern: /\b(Arsenal)\b/i, canonical: 'Arsenal' },
  { pattern: /\b(Chelsea)\b/i, canonical: 'Chelsea' },
  { pattern: /\b(Liverpool)\b/i, canonical: 'Liverpool' },
  { pattern: /\b(Manchester\s+United|Man\s+United|Man\s+Utd)\b/i, canonical: 'Manchester United' },
  { pattern: /\b(Manchester\s+City|Man\s+City)\b/i, canonical: 'Manchester City' },
  { pattern: /\b(Real\s+Madrid)\b/i, canonical: 'Real Madrid' },
  { pattern: /\b(Barcelona|Barca)\b/i, canonical: 'Barcelona' },
  { pattern: /\b(Bayern\s+Munich|Bayern)\b/i, canonical: 'Bayern Munich' },
  { pattern: /\b(PSG|Paris\s+Saint.Germain)\b/i, canonical: 'PSG' },
  { pattern: /\b(Juventus)\b/i, canonical: 'Juventus' },
  { pattern: /\b(Inter\s+Milan)\b/i, canonical: 'Inter Milan' },
  { pattern: /\b(Borussia\s+Dortmund|Dortmund)\b/i, canonical: 'Dortmund' },
  // Sports individuals
  { pattern: /\b(LeBron\s+James|LeBron)\b/i, canonical: 'LeBron James' },
  { pattern: /\b(Stephen\s+Curry|Steph\s+Curry)\b/i, canonical: 'Stephen Curry' },
  { pattern: /\b(Giannis\s+Antetokounmpo|Giannis)\b/i, canonical: 'Giannis' },
  { pattern: /\b(Luka\s+Doncic|Doncic)\b/i, canonical: 'Luka Doncic' },
  { pattern: /\b(Nikola\s+Jokic|Jokic)\b/i, canonical: 'Nikola Jokic' },
  { pattern: /\b(Patrick\s+Mahomes|Mahomes)\b/i, canonical: 'Patrick Mahomes' },
  { pattern: /\b(Lionel\s+Messi|Messi)\b/i, canonical: 'Messi' },
  { pattern: /\b(Cristiano\s+Ronaldo|Ronaldo)\b/i, canonical: 'Ronaldo' },
  { pattern: /\b(Erling\s+Haaland|Haaland)\b/i, canonical: 'Haaland' },
  { pattern: /\b(Kylian\s+Mbappe|Mbappe|Mbappé)\b/i, canonical: 'Mbappe' },
  { pattern: /\b(Shohei\s+Ohtani|Ohtani)\b/i, canonical: 'Ohtani' },
  { pattern: /\b(Connor\s+McDavid|McDavid)\b/i, canonical: 'McDavid' },
  // Countries / regions (as entities in geopolitical markets)
  { pattern: /\b(Ukraine)\b/i, canonical: 'Ukraine' },
  { pattern: /\b(Russia)\b/i, canonical: 'Russia' },
  { pattern: /\b(China)\b/i, canonical: 'China' },
  { pattern: /\b(Israel)\b/i, canonical: 'Israel' },
  { pattern: /\b(Iran)\b/i, canonical: 'Iran' },
  { pattern: /\b(Greenland)\b/i, canonical: 'Greenland' },
  { pattern: /\b(Taiwan)\b/i, canonical: 'Taiwan' },
  { pattern: /\b(Gaza)\b/i, canonical: 'Gaza' },
  { pattern: /\b(Palestine)\b/i, canonical: 'Palestine' },
]

function extractEntities(text) {
  const found = []
  for (const { pattern, canonical } of KNOWN_ENTITIES) {
    if (pattern.test(text)) {
      found.push(canonical)
    }
  }

  // Also try to extract unknown proper names from "Will X ..." pattern
  const willMatch = text.match(/^Will\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:[A-Z][a-z]+)?)\s+/i)
  if (willMatch) {
    const name = willMatch[1].trim()
    // Only add if not already captured and looks like a proper name (2+ words or known)
    if (name.split(/\s+/).length >= 2 && !found.some(e => e.toLowerCase() === name.toLowerCase())) {
      found.push(name)
    }
  }

  // Kalshi suffix pattern: "Question - CandidateName"
  const dashMatch = text.match(/\s+-\s+(.+)$/)
  if (dashMatch) {
    const candidate = dashMatch[1].trim()
    if (candidate.length >= 3 && !found.some(e => e.toLowerCase() === candidate.toLowerCase())) {
      found.push(candidate)
    }
  }

  return found
}

// Distinguish "primary entity" (the subject being acted on) from context entities
// For "Will Trump nominate Barron Trump?" → primary = "Barron Trump", context = "Donald Trump"
function extractPrimaryEntity(text, allEntities) {
  // Kalshi suffix is always the primary subject
  const dashMatch = text.match(/\s+-\s+(.+)$/)
  if (dashMatch) {
    const candidate = dashMatch[1].trim()
    return candidate
  }

  // "nominate/appoint X" → X is the primary subject
  const nominateMatch = text.match(/\b(?:nominat\w*|appoint\w*)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:[A-Z][a-z]+)?)\b/i)
  if (nominateMatch) {
    return nominateMatch[1].trim()
  }

  // "Will X be the next Y" → X is primary
  const nextMatch = text.match(/(?:Will|be)\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:[A-Z][a-z]+)?)\s+(?:be\s+)?(?:the\s+)?next\b/i)
  if (nextMatch) {
    return nextMatch[1].trim()
  }

  // "Will X win/run/reach/hit..." → X is primary
  const willActMatch = text.match(/^Will\s+([A-Z][a-z]+(?:\s+[A-Z]\.?\s*)?(?:[A-Z][a-z]+)?)\s+(?:win|run|enter|launch|reach|hit|pass|be\s|go\s|defeat|beat)/i)
  if (willActMatch) {
    return willActMatch[1].trim()
  }

  // If only one entity, that's the primary
  if (allEntities.length === 1) return allEntities[0]

  // Multiple entities with no clear primary — return null (ambiguous)
  return null
}

// ── Topic Detection ──────────────────────────────────

const TOPIC_RULES = [
  { pattern: /\b(vice\s+president\w*)\b.*\b(nominat\w*|nominee)\b/i, topic: 'vp_nomination' },
  { pattern: /\b(nominat\w*|nominee)\b.*\b(vice\s+president\w*)\b/i, topic: 'vp_nomination' },
  { pattern: /\bvp\s+(nominat\w*|nominee)\b/i, topic: 'vp_nomination' },
  { pattern: /\b(nominat\w*|nominee)\b/i, topic: 'nomination' },
  { pattern: /\b(primary|caucus)\b/i, topic: 'primary' },
  { pattern: /\b(president\w*|election|elected|electoral)\b.*\b(win|won|victory)\b/i, topic: 'election' },
  { pattern: /\b(win|won)\b.*\b(president\w*|election|electoral)\b/i, topic: 'election' },
  { pattern: /\b(popular vote)\b/i, topic: 'election' },
  { pattern: /\b(electoral college|electoral vote)\b/i, topic: 'election' },
  { pattern: /\b(impeach\w*)\b/i, topic: 'impeachment' },
  { pattern: /\b(resign|step down)\b/i, topic: 'resignation' },
  // Sports
  { pattern: /\bgame\s+\d\b/i, topic: 'sports_game' },
  { pattern: /\bregular\s+time\b/i, topic: 'sports_game' },
  { pattern: /\b(series|playoff series)\b/i, topic: 'sports_series' },
  { pattern: /\b(nba|nfl|mlb|nhl)\s+(champion\w*|finals)\b/i, topic: 'sports_championship' },
  { pattern: /\b(super bowl|world series|stanley cup)\b/i, topic: 'sports_championship' },
  { pattern: /\bwin\b.*\b(championship|title|cup|trophy|finals|premier league|champions league|la liga|serie a|bundesliga)\b/i, topic: 'sports_championship' },
  { pattern: /\b(championship|title|cup|trophy|finals)\b.*\bwin\b/i, topic: 'sports_championship' },
  { pattern: /\b(world cup|copa america|euros)\b/i, topic: 'sports_championship' },
  { pattern: /\b(mvp|most valuable)\b/i, topic: 'sports_award' },
  { pattern: /\b(relegate|relegation|promoted|promotion)\b/i, topic: 'sports_relegation' },
  { pattern: /\b(transfer|sign\w*)\b.*\b(player|club|team)\b/i, topic: 'sports_transfer' },
  { pattern: /\b(over|under)\b.*\b(wins|points|goals|touchdowns|yards)\b/i, topic: 'sports_over_under' },
  { pattern: /\b(wins|points|goals|touchdowns|yards)\b.*\b(over|under)\b/i, topic: 'sports_over_under' },
  // Crypto
  { pattern: /\b(bitcoin|btc|ethereum|eth|solana|dogecoin|xrp|crypto)\b.*\b(price|above|below|hit|reach|exceed)\b/i, topic: 'crypto_price' },
  { pattern: /\b(price|above|below|hit|reach|exceed)\b.*\b(bitcoin|btc|ethereum|eth|solana|dogecoin|xrp|crypto)\b/i, topic: 'crypto_price' },
  // Economics
  { pattern: /\b(fed|fomc|federal reserve)\b.*\b(rate|cut|hike|raise|lower|bps|basis)\b/i, topic: 'fed_rates' },
  { pattern: /\b(rate|cut|hike|raise|lower|bps|basis)\b.*\b(fed|fomc|federal reserve)\b/i, topic: 'fed_rates' },
  { pattern: /\b(inflation|cpi|consumer price)\b/i, topic: 'inflation' },
  { pattern: /\b(recession|gdp|economic\s+(growth|contraction))\b/i, topic: 'macro' },
  { pattern: /\b(tariff\w*|trade war|import duty)\b/i, topic: 'macro' },
  { pattern: /\b(unemployment|jobs report|nonfarm)\b/i, topic: 'macro' },
  // Stock price targets
  { pattern: /\b(stock|share|TSLA|AAPL|GOOG|MSFT|AMZN|NVDA|META)\b.*\b(price|above|below|hit|reach|exceed)\b/i, topic: 'price_target' },
  { pattern: /\b(market cap|valuation)\b/i, topic: 'price_target' },
  // Corporate events
  { pattern: /\b(IPO|go\s+public)\b/i, topic: 'ipo' },
  { pattern: /\b(acquir\w*|merger|merg\w*|buyout|takeover)\b/i, topic: 'acquisition' },
  { pattern: /\b(bankrupt\w*|default\w*)\b/i, topic: 'bankruptcy' },
  // Geopolitical
  { pattern: /\b(war|invasion|military|ceasefire|peace\s+deal)\b/i, topic: 'geopolitical' },
  { pattern: /\b(annex|territory|sovereignty)\b/i, topic: 'geopolitical' },
  // Science / Tech
  { pattern: /\b(orbit|mars|moon|launch|starship|rocket)\b/i, topic: 'space' },
  { pattern: /\b(AGI|artificial general intelligence)\b/i, topic: 'tech' },
  { pattern: /\b(robotaxi|autonomous|self.driving)\b/i, topic: 'tech' },
  // Climate
  { pattern: /\b(temperature|warming|degrees|climate|hurricane|wildfire)\b/i, topic: 'climate' },
]

function detectTopic(text) {
  for (const { pattern, topic } of TOPIC_RULES) {
    if (pattern.test(text)) return topic
  }
  // Broad fallback checks
  if (/\b(president|senate|congress|governor|mayor|democrat|republican|vote|ballot)\b/i.test(text)) return 'election'
  if (/\b(nba|nfl|mlb|nhl|mls|ufc|soccer|football|basketball|baseball|hockey)\b/i.test(text)) return 'sports_championship'
  return 'generic_unknown'
}

// ── Action Detection ─────────────────────────────────

const ACTION_RULES = [
  // Order matters — more specific patterns first
  { patterns: [/\brun\s+for\b/i, /\brun\s+in\s+the\b/i, /\brunning\s+for\b/i, /\benter\s+the\s+race\b/i, /\bseek\s+(the\s+)?(presidency|nomination|office)\b/i, /\bannounce\w*\s+(a\s+)?run\b/i, /\bcandidat\w*/i], action: 'run_for' },
  { patterns: [/\bnominat\w*/i, /\bnominee\b/i], action: 'be_nominee' },
  { patterns: [/\bwin\b/i, /\bwinner\b/i, /\bchampion\b/i, /\bwon\b/i, /\bvictory\b/i, /\bdefeat\b/i], action: 'win' },
  { patterns: [/\belect\w*/i, /\bvote\b/i], action: 'win' }, // "elected" = win variant
  { patterns: [/\b(hit|reach|exceed|surpass|pass)\b/i], action: 'reach' },
  { patterns: [/\b(above|over|more\s+than|higher\s+than|greater\s+than)\b/i], action: 'above' },
  { patterns: [/\b(below|under|less\s+than|lower\s+than|fewer\s+than)\b/i], action: 'below' },
  { patterns: [/\b(cut|decrease|lower|reduc)\w*\b/i], action: 'decrease' },
  { patterns: [/\b(hike|increase|raise)\w*\b/i], action: 'increase' },
  { patterns: [/\b(ban|prohibit|outlaw)\w*/i], action: 'ban' },
  { patterns: [/\b(resign|step\s+down|leave\s+office|quit)\b/i], action: 'resign' },
  { patterns: [/\bimpeach\w*/i], action: 'impeach' },
  { patterns: [/\b(launch|deliver|release|ship|deploy)\b/i], action: 'launch' },
  { patterns: [/\b(land\s+on|orbit|visit)\b/i], action: 'land' },
  { patterns: [/\b(acquir\w*|merger|merg\w*|buyout|takeover)\b/i], action: 'acquire' },
  { patterns: [/\bIPO\b/i, /\bgo\s+public\b/i], action: 'ipo' },
  { patterns: [/\b(bankrupt\w*|default\w*)\b/i], action: 'bankrupt' },
  { patterns: [/\b(relegate|relegation)\w*/i], action: 'relegate' },
  { patterns: [/\b(promot)\w*\b/i], action: 'promote' },
  { patterns: [/\b(transfer|sign|signing)\b/i], action: 'transfer' },
  { patterns: [/\b(happen|occur|take\s+place)\b/i], action: 'happen' },
]

function detectAction(text) {
  // Handle compound phrases first
  // "win the nomination/primary" = be_nominee, not win
  if (/\bwin\b.{0,30}\b(nominat|primary)\b/i.test(text)) return 'be_nominee'
  // "win the election/presidency" = win (election win)
  if (/\bwin\b.{0,30}\b(election|president)\b/i.test(text)) return 'win'

  for (const { patterns, action } of ACTION_RULES) {
    for (const p of patterns) {
      if (p.test(text)) return action
    }
  }
  return 'unknown'
}

// ── Numeric Target Extraction ────────────────────────

function extractNumericTarget(text) {
  // Dollar amounts: $100K, $1M, $50,000, $100000
  const dollarMatch = text.match(/\$\s*([\d,.]+)\s*([KMBkmb])?/i)
  if (dollarMatch) {
    let val = parseFloat(dollarMatch[1].replace(/,/g, ''))
    const suffix = (dollarMatch[2] || '').toUpperCase()
    if (suffix === 'K') val *= 1_000
    if (suffix === 'M') val *= 1_000_000
    if (suffix === 'B') val *= 1_000_000_000
    return val
  }

  // Percentage: 4%, 3.5 percent
  const pctMatch = text.match(/([\d.]+)\s*(%|percent)/i)
  if (pctMatch) return parseFloat(pctMatch[1])

  // BPS: 25 bps, 50 basis points
  const bpsMatch = text.match(/(\d+)\s*(bps|basis\s+points)/i)
  if (bpsMatch) return parseFloat(bpsMatch[1])

  // Large round numbers in context: "above 100000", "hit 150K"
  const numMatch = text.match(/\b(\d{3,})\s*([KMBkmb])?\b/)
  if (numMatch) {
    let val = parseFloat(numMatch[1])
    const suffix = (numMatch[2] || '').toUpperCase()
    if (suffix === 'K') val *= 1_000
    if (suffix === 'M') val *= 1_000_000
    if (suffix === 'B') val *= 1_000_000_000
    if (val >= 100) return val // Only meaningful targets
  }

  return null
}

// ── Polarity Detection ───────────────────────────────

function detectPolarity(text) {
  if (/\bnot\b/i.test(text) || /\bwon't\b/i.test(text) || /\bwill\s+not\b/i.test(text) ||
      /\bfail\s+to\b/i.test(text) || /\bnever\b/i.test(text)) {
    return 'negative'
  }
  return 'positive'
}

// ── Date Bucket ──────────────────────────────────────

function buildDateBucket(endDate) {
  if (!endDate) return null
  const d = new Date(endDate)
  if (isNaN(d.getTime())) return null
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Extract year mentioned in question text
function extractYearFromText(text) {
  const match = text.match(/\b(20[2-3]\d)\b/)
  return match ? match[1] : null
}

// Extract month mentioned in question text
function extractMonthFromText(text) {
  const monthMap = {
    'january': '01', 'jan': '01', 'february': '02', 'feb': '02',
    'march': '03', 'mar': '03', 'april': '04', 'apr': '04',
    'may': '05', 'june': '06', 'jun': '06', 'july': '07', 'jul': '07',
    'august': '08', 'aug': '08', 'september': '09', 'sep': '09',
    'october': '10', 'oct': '10', 'november': '11', 'nov': '11',
    'december': '12', 'dec': '12',
  }
  const match = text.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\b/i)
  if (match) return monthMap[match[1].toLowerCase()] || null
  return null
}

// ── Scope Detection (tournament vs group vs match) ───
// Prevents "Win World Cup" from matching "Win Group B of World Cup"

function detectScope(text) {
  // Group stage: "Group A", "Group B", "group stage"
  if (/\bgroup\s+[A-Za-z]\b/i.test(text)) return 'group'
  if (/\bgroup\s+stage\b/i.test(text)) return 'group'
  // Knockout rounds
  if (/\bround\s+of\s+\d+\b/i.test(text)) return 'knockout'
  if (/\bquarterfinal\w*\b/i.test(text)) return 'knockout'
  if (/\bsemifinal\w*\b/i.test(text)) return 'knockout'
  if (/\bsemi-final\w*\b/i.test(text)) return 'knockout'
  if (/\b(third|3rd)\s+place\b/i.test(text)) return 'knockout'
  // Specific match: "vs", "match", "game"
  if (/\bvs\.?\b/i.test(text)) return 'match'
  if (/\bgame\s+\d\b/i.test(text)) return 'match'
  // Conference / division
  if (/\b(afc|nfc|eastern|western|atlantic|pacific|central|southeast|northwest|southwest)\s+(conference|division|champion\w*|winner|final\w*)\b/i.test(text)) return 'division'
  if (/\b(conference|division)\s+(champion\w*|winner|final\w*)\b/i.test(text)) return 'division'
  // Explicit "win the [tournament]" with no sub-qualifier = tournament scope
  if (/\bwin\b.*\b(world cup|championship|title|cup|trophy|super bowl|world series|stanley cup|premier league|champions league|finals)\b/i.test(text)) return 'tournament'
  if (/\b(world cup|championship|super bowl|world series|stanley cup)\b.*\b(winner|champion)\b/i.test(text)) return 'tournament'
  return null
}

// ── Keyword Extraction ───────────────────────────────

function extractKeywords(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !STOPWORDS.has(w))
}

// ── Main Fingerprint Builder ─────────────────────────

export function buildFingerprint(market) {
  const q = market.question || ''
  const desc = market.description || ''
  const combined = `${q} ${desc}`

  const allEntities = extractEntities(q)
  const primaryEntity = extractPrimaryEntity(q, allEntities)
  const topic = detectTopic(q)
  const action = detectAction(q)
  const scope = detectScope(q)
  const dateBucket = buildDateBucket(market.endDate)
  const yearInText = extractYearFromText(q)
  const monthInText = extractMonthFromText(q)
  const numericTarget = extractNumericTarget(q)
  const polarity = detectPolarity(q)
  const keywords = extractKeywords(q)

  return {
    entity: primaryEntity,
    allEntities,
    topic,
    action,
    scope,
    dateBucket,
    yearInText,
    monthInText,
    numericTarget,
    polarity,
    keywords,
    // Keep original for debugging
    _question: q,
    _source: market.source || null,
  }
}

// ── Category (kept for UI display) ───────────────────

export function categorize(question) {
  const q = question.toLowerCase()
  if (/trump|biden|harris|vance|desantis|president|democrat|republican|senate|congress|governor|elect|vote|political|party|nomination|nominee|impeach|speaker|cabinet|scotus|supreme court/.test(q)) return 'US Politics'
  if (/pope|nato|eu\b|ukraine|russia|china|iran|israel|regime|war\b|ceasefire|sanction|territory|annex|greenland|gaza|palestine|putin|zelensky|modi|trudeau|starmer|macron/.test(q)) return 'World Politics'
  if (/bitcoin|btc|ethereum|eth|crypto|token|defi|nft|solana|dogecoin|ripple|xrp|stablecoin|blockchain/.test(q)) return 'Crypto'
  if (/fed\b|federal reserve|interest rate|rate cut|rate hike|gdp|inflation|recession|economy|cpi|jobs|unemployment|tariff|debt|default|treasury|bond|s&p|dow|nasdaq|stock market/.test(q)) return 'Economics'
  if (/spacex|starship|apple|google|openai|ai\b|artificial intelligence|tech|iphone|tesla|microsoft|meta|amazon|nvidia|robotaxi|autonomous|chatgpt|agi/.test(q)) return 'Tech & AI'
  if (/nfl|nba|mlb|nhl|mls|ufc|world cup|champion|super bowl|sport|premier league|champions league|la liga|serie a|bundesliga|finals|playoff|mvp|lakers|celtics|warriors|chiefs|eagles|yankees|dodgers|pacers|grizzlies|arsenal|chelsea|liverpool|manchester|real madrid|barcelona|bayern|wimbledon|us open|french open|australian open|march madness|ncaa|stanley cup|world series|lebron|mahomes|messi|ronaldo|ohtani|haaland/.test(q)) return 'Sports'
  if (/mars|moon|orbit|nasa|spacex|rocket|launch|asteroid|satellite|cern|fusion|quantum|vaccine|pandemic|virus|disease/.test(q)) return 'Science & Space'
  if (/climate|temperature|weather|hurricane|carbon|warming|degrees|wildfire|drought|flood|sea level|emission/.test(q)) return 'Climate'
  if (/oscar|grammy|emmy|movie|film|album|music|concert|netflix|disney|tiktok|youtube|celebrity|kardashian|taylor swift|beyonce/.test(q)) return 'Entertainment'
  if (/ipo|acquire|merger|bankrupt|valuation|startup|revenue|profit|market cap|stock|shares|ceo|company/.test(q)) return 'Business'
  return 'Other'
}
