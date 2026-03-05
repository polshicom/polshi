'use client'

import { useState, useEffect, useCallback } from 'react'
import { Flame } from 'lucide-react'
import UpgradeOverlay from './UpgradeOverlay'

const FREE_LIMIT = 5
const VERIFIED_KEY = 'polshi_community_verified'
const REJECTED_KEY = 'polshi_community_rejected'

// localStorage helpers
function loadSet(key) {
  if (typeof window === 'undefined') return new Set()
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')) }
  catch { return new Set() }
}
function saveSet(key, set) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify([...set]))
}
function loadMap(key) {
  if (typeof window === 'undefined') return new Map()
  try { return new Map(JSON.parse(localStorage.getItem(key) || '[]')) }
  catch { return new Map() }
}
function saveMap(key, map) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify([...map]))
}

function formatInterval(seconds) {
  if (seconds >= 60) return `${Math.round(seconds / 60)}m`
  return `${seconds}s`
}

function formatEndDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d)) return '—'
  const now = new Date()
  const diffMs = d - now
  if (diffMs < 0) return 'Ended'
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 30) return `${days}d`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo`
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
}

// Enticing fake rows shown blurred to free users
const FAKE_PREMIUM_ROWS = [
  {
    question: 'Will the Fed cut rates at the June 2026 meeting?',
    polymarket: 62, kalshi: 54, edge: 8, difference: 8,
    totalCost: 92, verified: true,
    aiConfidence: 97, aiReason: 'Same event, same date',
    volume: '$14.2M', endDate: '2026-06-15',
  },
  {
    question: 'Will Bitcoin reach $150K before July 2026?',
    polymarket: 38, kalshi: 31, edge: 7, difference: 7,
    totalCost: 93, verified: true,
    aiConfidence: 95, aiReason: 'Same price target and date',
    volume: '$9.8M', endDate: '2026-07-01',
  },
  {
    question: 'Will Tesla deliver Robotaxi in 2026?',
    polymarket: 24, kalshi: 18, edge: 6, difference: 6,
    totalCost: 94, verified: true,
    aiConfidence: 92, aiReason: 'Same product launch event',
    volume: '$7.1M', endDate: '2026-12-31',
  },
  {
    question: 'Will the US enter a recession in 2026?',
    polymarket: 41, kalshi: 35, edge: 6, difference: 6,
    totalCost: 94, verified: true,
    aiConfidence: 94, aiReason: 'Same economic event',
    volume: '$11.5M', endDate: '2026-12-31',
  },
  {
    question: 'Will SpaceX Starship reach orbit before April 2026?',
    polymarket: 73, kalshi: 68, edge: 5, difference: 5,
    totalCost: 95, verified: true,
    aiConfidence: 91, aiReason: 'Same mission milestone',
    volume: '$5.3M', endDate: '2026-04-01',
  },
]

export default function MarketTable({ initialMarkets, isPro, refreshInterval }) {
  const [markets, setMarkets] = useState(initialMarkets || [])
  const [search, setSearch] = useState('')
  const [aiFilter, setAiFilter] = useState('all')
  const [sortKey, setSortKey] = useState('difference')
  const [sortDir, setSortDir] = useState('desc')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [countdown, setCountdown] = useState(refreshInterval || 60)
  const [refreshing, setRefreshing] = useState(false)
  const [communityVerified, setCommunityVerified] = useState(new Set())
  const [communityRejected, setCommunityRejected] = useState(new Map())
  const [arbCount, setArbCount] = useState(0)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [freeDismissed, setFreeDismissed] = useState(new Set())
  const [stake, setStake] = useState(1000)

  useEffect(() => {
    setCommunityVerified(loadSet(VERIFIED_KEY))
    setCommunityRejected(loadMap(REJECTED_KEY))
  }, [])

  // Count arbs with a positive edge for the banner
  useEffect(() => {
    const count = markets.filter(m => m.edge > 0).length
    setArbCount(count)
  }, [markets])

  const handleVerifyYes = useCallback((question) => {
    setCommunityVerified(prev => {
      const next = new Set(prev)
      next.add(question)
      saveSet(VERIFIED_KEY, next)
      return next
    })
    setCommunityRejected(prev => {
      const next = new Map(prev)
      next.delete(question)
      saveMap(REJECTED_KEY, next)
      return next
    })
  }, [])

  const handleFreeVoteNo = useCallback((question) => {
    setFreeDismissed(prev => {
      const next = new Set(prev)
      next.add(question)
      return next
    })
  }, [])

  const handleVerifyNo = useCallback((question, reason) => {
    setCommunityRejected(prev => {
      const next = new Map(prev)
      next.set(question, reason)
      saveMap(REJECTED_KEY, next)
      return next
    })
    setCommunityVerified(prev => {
      const next = new Set(prev)
      next.delete(question)
      saveSet(VERIFIED_KEY, next)
      return next
    })
  }, [])

  const fetchMarkets = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true)
    try {
      const res = await fetch('/api/markets?confidence=all&limit=100')
      const data = await res.json()
      if (data.markets) {
        setMarkets(data.markets)
        setLastUpdated(new Date())
        setCountdown(refreshInterval || 60)
      }
    } catch {}
    if (manual) setRefreshing(false)
  }, [refreshInterval])

  useEffect(() => {
    if (!isPro) return
    const interval = setInterval(fetchMarkets, (refreshInterval || 60) * 1000)
    return () => clearInterval(interval)
  }, [isPro, refreshInterval, fetchMarkets])

  // Countdown timer
  useEffect(() => {
    if (!isPro) return
    const tick = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? refreshInterval || 60 : prev - 1))
    }, 1000)
    return () => clearInterval(tick)
  }, [isPro, refreshInterval])

  // Apply community votes
  const enrichedMarkets = markets.map(m => {
    if (m.verified) return m
    const isCommunityYes = communityVerified.has(m.question)
    const rejectionReason = communityRejected.get(m.question)
    if (isCommunityYes) {
      const edge = Math.abs(m.polymarket - m.kalshi)
      return { ...m, communityVerified: true, edge, difference: edge, totalCost: 100 - edge }
    }
    if (rejectionReason !== undefined) {
      return { ...m, communityRejected: true, rejectionReason }
    }
    return m
  })

  const filtered = enrichedMarkets
    .filter(m => {
      if (m.communityRejected) return false
      if (search && !m.question.toLowerCase().includes(search.toLowerCase())) return false
      if (aiFilter !== 'all') {
        const score = m.aiConfidence ?? 0
        if (score < Number(aiFilter)) return false
      }
      return true
    })
    .sort((a, b) => {
      let aVal, bVal
      if (sortKey === 'difference') {
        aVal = a.difference ?? -1
        bVal = b.difference ?? -1
      } else if (sortKey === 'totalCost') {
        aVal = a.totalCost ?? 999
        bVal = b.totalCost ?? 999
      } else if (sortKey === 'aiConfidence') {
        aVal = a.aiConfidence ?? -1
        bVal = b.aiConfidence ?? -1
      } else if (sortKey === 'volume') {
        aVal = parseVolume(a.volume)
        bVal = parseVolume(b.volume)
      } else if (sortKey === 'polymarket') {
        aVal = a.polymarket
        bVal = b.polymarket
      } else if (sortKey === 'kalshi') {
        aVal = a.kalshi
        bVal = b.kalshi
      } else if (sortKey === 'endDate') {
        aVal = a.endDate ? new Date(a.endDate).getTime() : Infinity
        bVal = b.endDate ? new Date(b.endDate).getTime() : Infinity
      } else {
        aVal = a[sortKey]
        bVal = b[sortKey]
      }
      if (sortDir === 'asc') return aVal > bVal ? 1 : -1
      return aVal < bVal ? 1 : -1
    })

  const lockedSorts = isPro ? [] : ['polymarket', 'kalshi', 'difference', 'aiConfidence']

  function handleSort(key) {
    if (lockedSorts.includes(key)) return
    if (sortKey === key) {
      setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  function sortArrow(key) {
    if (sortKey !== key) return null
    return (
      <svg className="mt-sort-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {sortDir === 'desc'
          ? <path d="M6 9l6 6 6-6" />
          : <path d="M18 15l-6-6-6 6" />
        }
      </svg>
    )
  }

  // Free users: show 5 rows that have at least 1¢ edge AND 100% AI confidence, minus dismissed
  const freeEligible = isPro ? [] : filtered.filter(m => m.edge != null && m.edge >= 1 && (m.aiConfidence ?? 0) === 100 && !freeDismissed.has(m.question))
  const visibleRows = isPro ? filtered : freeEligible.slice(0, FREE_LIMIT)
  const realBlurredRows = isPro ? [] : freeEligible.slice(FREE_LIMIT)
  const fakeRows = isPro ? [] : FAKE_PREMIUM_ROWS
  const blurredRows = [...realBlurredRows, ...fakeRows]
  const showOverlay = !isPro && (freeEligible.length > FREE_LIMIT || fakeRows.length > 0)

  return (
    <>
      <div className="filter-bar">
        <input
          type="text"
          className="filter-search"
          placeholder="Search arbitrage opportunities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={aiFilter}
          onChange={(e) => isPro && setAiFilter(e.target.value)}
          disabled={!isPro}
          title={!isPro ? 'Upgrade to Pro to filter by AI confidence' : ''}
          style={!isPro ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          <option value="all">All AI confidence</option>
          <option value="10">AI ≥ 10%</option>
          <option value="30">AI ≥ 30%</option>
          <option value="50">AI ≥ 50%</option>
          <option value="75">AI ≥ 75%</option>
        </select>
        <div className="stake-input-wrap">
          <label className="stake-label">Stake</label>
          <span className="stake-dollar">$</span>
          <input
            type="number"
            className="stake-input"
            value={stake}
            onChange={(e) => setStake(Math.max(0, Number(e.target.value) || 0))}
            min="0"
            step="100"
          />
        </div>
        <div className="refresh-indicator">
          <span className={`refresh-dot ${isPro ? '' : 'stale'}`} />
          {isPro
            ? `Live · refreshes in ${formatInterval(countdown)}`
            : `Delayed · every ${formatInterval(refreshInterval)}`
          }
          <button
            className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
            onClick={() => fetchMarkets(true)}
            disabled={refreshing}
            title="Refresh now"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
          </button>
        </div>
      </div>

      <div className="upgrade-overlay-wrapper">
        <div className="mt-container">
          {/* Header */}
          <div className="mt-header">
            <div className={`mt-col-market ${sortKey === 'question' ? 'mt-sorted' : ''}`} onClick={() => handleSort('question')}>
              Market {sortArrow('question')}
            </div>
            <div className={`mt-col-price ${sortKey === 'polymarket' ? 'mt-sorted' : ''} ${lockedSorts.includes('polymarket') ? 'mt-locked' : ''}`} onClick={() => handleSort('polymarket')}>
              Poly {sortArrow('polymarket')}
            </div>
            <div className={`mt-col-price ${sortKey === 'kalshi' ? 'mt-sorted' : ''} ${lockedSorts.includes('kalshi') ? 'mt-locked' : ''}`} onClick={() => handleSort('kalshi')}>
              Kalshi {sortArrow('kalshi')}
            </div>
            <div className={`mt-col-num ${sortKey === 'difference' ? 'mt-sorted' : ''} ${lockedSorts.includes('difference') ? 'mt-locked' : ''}`} onClick={() => handleSort('difference')}>
              Edge {sortArrow('difference')}
            </div>
            <div className={`mt-col-num ${sortKey === 'totalCost' ? 'mt-sorted' : ''}`} onClick={() => handleSort('totalCost')}>
              Cost {sortArrow('totalCost')}
            </div>
            <div className={`mt-col-ai ${sortKey === 'aiConfidence' ? 'mt-sorted' : ''} ${lockedSorts.includes('aiConfidence') ? 'mt-locked' : ''}`} onClick={() => handleSort('aiConfidence')}>
              AI {sortArrow('aiConfidence')}
            </div>
            <div className={`mt-col-date ${sortKey === 'endDate' ? 'mt-sorted' : ''}`} onClick={() => handleSort('endDate')}>
              Ends {sortArrow('endDate')}
            </div>
            <div className={`mt-col-vol ${sortKey === 'volume' ? 'mt-sorted' : ''}`} onClick={() => handleSort('volume')}>
              Vol {sortArrow('volume')}
            </div>
            <div className="mt-col-profit">
              Profit
            </div>
          </div>

          {/* Rows */}
          <div className="mt-body">
            {visibleRows.map((m, i) => (
              <MarketRow
                key={i}
                market={m}
                isPro={isPro}
                stake={stake}
                onVerifyYes={handleVerifyYes}
                onVerifyNo={isPro ? handleVerifyNo : handleFreeVoteNo}
                isLast={i === visibleRows.length - 1 && blurredRows.length === 0}
              />
            ))}
            {blurredRows.map((m, i) => (
              <MarketRow
                key={`blur-${i}`}
                market={m}
                blurred
                stake={stake}
                isLast={i === blurredRows.length - 1}
              />
            ))}
            {filtered.length === 0 && (
              <div className="mt-empty">No arbitrage opportunities found</div>
            )}
          </div>
        </div>

        {showOverlay && <UpgradeOverlay count={filtered.length - FREE_LIMIT} />}
      </div>

      {!isPro && !bannerDismissed && arbCount > 0 && (
        <div className="arb-banner">
          <div className="arb-banner-inner">
            <div className="arb-banner-content">
              <Flame size={16} className="arb-banner-icon" />
              <span className="arb-banner-text">
                <strong>{arbCount} arb{arbCount !== 1 ? 's' : ''}</strong> found in the past hour
              </span>
            </div>
            <a href="/signup" className="arb-banner-btn">Try free</a>
            <button className="arb-banner-close" onClick={() => setBannerDismissed(true)} aria-label="Dismiss">
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function MarketRow({ market: m, blurred, isPro, stake = 1000, onVerifyYes, onVerifyNo, isLast }) {
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')

  const isAiVerified = m.verified === true && !m.communityVerified
  const isCommunityVerified = m.communityVerified === true
  const isCommunityRejected = m.communityRejected === true
  const isVerified = isAiVerified || isCommunityVerified
  const needsVote = !isVerified && !isCommunityRejected && !blurred
  const hasEdge = m.edge != null && m.edge > 0
  const isArbSafe = m.isArbSafe === true
  const isPossibleMatch = m.aiPossible === true && !isVerified

  const edgeClass = !hasEdge
    ? 'spread-unverified'
    : isArbSafe
    ? (m.edge >= 5 ? 'spread-high' : m.edge >= 3 ? 'spread-medium' : 'spread-low')
    : 'spread-unverified'

  // Highlight the cheaper platform
  const polyIsCheaper = m.polymarket < m.kalshi
  const kalshiIsCheaper = m.kalshi < m.polymarket

  function handleNo() {
    if (!isPro) {
      onVerifyNo?.(m.question)
      return
    }
    setShowFeedback(true)
  }

  function handleSubmitFeedback() {
    onVerifyNo?.(m.question, feedbackText || 'No reason given')
    setShowFeedback(false)
    setFeedbackText('')
  }

  function handleCancelFeedback() {
    setShowFeedback(false)
    setFeedbackText('')
  }

  const rowClasses = [
    'mt-row',
    blurred ? 'mt-blurred' : '',
    !isVerified && !isCommunityRejected ? 'mt-unverified' : '',
    isCommunityVerified ? 'mt-community' : '',
    isCommunityRejected ? 'mt-rejected' : '',
    isLast ? 'mt-row-last' : '',
  ].filter(Boolean).join(' ')

  return (
    <>
      <div className={rowClasses}>
        {/* Market */}
        <div className="mt-col-market">
          <div className="mt-market-info">
            <span className="mt-question">{m.question}</span>
            <div className="mt-badges">
              {isCommunityVerified && (
                <span className="community-badge">Community Verified</span>
              )}
              {isPossibleMatch && (
                <span className="mt-possible-badge" title={m.matchReason || ''}>Possible match — verify before trading</span>
              )}
              {needsVote && !showFeedback && (
                <span className="verify-buttons">
                  <span className="verify-label">Match?</span>
                  <button className="verify-btn verify-yes" onClick={() => onVerifyYes?.(m.question)}>Yes</button>
                  <button className="verify-btn verify-no" onClick={handleNo}>No</button>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Polymarket */}
        <div className={`mt-col-price ${polyIsCheaper && hasEdge ? 'mt-buy' : ''}`}>
          {m.polymarketUrl ? (
            <a href={m.polymarketUrl} target="_blank" rel="noopener noreferrer" className="market-link">
              {m.polymarket}¢
            </a>
          ) : (
            <span>{m.polymarket}¢</span>
          )}
        </div>

        {/* Kalshi */}
        <div className={`mt-col-price ${kalshiIsCheaper && hasEdge ? 'mt-buy' : ''}`}>
          {m.kalshiUrl ? (
            <a href={m.kalshiUrl} target="_blank" rel="noopener noreferrer" className="market-link">
              {m.kalshi}¢
            </a>
          ) : (
            <span>{m.kalshi}¢</span>
          )}
        </div>

        {/* Edge */}
        <div className={`mt-col-num mt-edge ${edgeClass}`}>
          {m.edge != null ? `${m.edge}¢` : '—'}
        </div>

        {/* Cost */}
        <div className="mt-col-num mt-muted">
          {m.totalCost != null ? `${m.totalCost}¢` : '—'}
        </div>

        {/* AI */}
        <div className="mt-col-ai">
          <AiConfidenceBadge score={m.aiConfidence} reason={m.aiReason} />
        </div>

        {/* End Date */}
        <div className="mt-col-date mt-muted" title={m.endDate || ''}>
          {formatEndDate(m.endDate)}
        </div>

        {/* Volume */}
        <div className="mt-col-vol mt-muted">
          {m.volume}
        </div>

        {/* Profit */}
        <div className="mt-col-profit">
          {hasEdge && isArbSafe ? (
            <span className="mt-profit-value">${Math.round(stake * m.edge / 100)}</span>
          ) : hasEdge ? (
            <span className="mt-muted" title="Verify match before trading">{m.edge}¢</span>
          ) : (
            <span className="mt-muted">—</span>
          )}
        </div>
      </div>

      {showFeedback && (
        <div className="mt-feedback">
          <div className="feedback-form">
            <span className="feedback-label">Why is this not a match?</span>
            <input
              type="text"
              className="feedback-input"
              placeholder="e.g. Different event types, wrong candidate..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitFeedback()}
              autoFocus
            />
            <button className="feedback-submit" onClick={handleSubmitFeedback}>Submit</button>
            <button className="feedback-cancel" onClick={handleCancelFeedback}>Cancel</button>
          </div>
        </div>
      )}
    </>
  )
}

function AiConfidenceBadge({ score, reason }) {
  if (score == null) {
    return <span className="ai-badge ai-badge-none">—</span>
  }

  let cls
  if (score >= 90) cls = 'ai-badge-high'
  else if (score >= 70) cls = 'ai-badge-medium'
  else cls = 'ai-badge-low'

  return (
    <span className={`ai-badge ${cls}`} title={reason || ''}>
      {score}%
    </span>
  )
}

function parseVolume(vol) {
  if (typeof vol === 'number') return vol
  if (!vol) return 0
  const str = vol.replace('$', '').replace(',', '')
  if (str.endsWith('M')) return parseFloat(str) * 1_000_000
  if (str.endsWith('K')) return parseFloat(str) * 1_000
  return parseFloat(str) || 0
}
