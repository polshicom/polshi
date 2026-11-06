'use client'

import Link from 'next/link'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
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

function formatTimeAgo(date) {
  if (!date) return ''
  const seconds = Math.round((Date.now() - date.getTime()) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

// Enticing fake rows shown blurred to free users
const FAKE_PREMIUM_ROWS = [
  {
    question: 'Will the Fed cut rates at the June 2026 meeting?',
    polymarket: 62, kalshi: 54, edge: 8, difference: 8,
    totalCost: 92, verified: true, isArbSafe: true,
    matchConfidence: 92, matchReason: 'Same event, same date',
    volume: '$14.2M', endDate: '2026-06-15', category: 'Economics',
  },
  {
    question: 'Will Bitcoin reach $150K before July 2026?',
    polymarket: 38, kalshi: 31, edge: 7, difference: 7,
    totalCost: 93, verified: true, isArbSafe: true,
    matchConfidence: 88, matchReason: 'Same price target and date',
    volume: '$9.8M', endDate: '2026-07-01', category: 'Crypto',
  },
  {
    question: 'Will Tesla deliver Robotaxi in 2026?',
    polymarket: 24, kalshi: 18, edge: 6, difference: 6,
    totalCost: 94, verified: true, isArbSafe: true,
    matchConfidence: 85, matchReason: 'Same product launch event',
    volume: '$7.1M', endDate: '2026-12-31', category: 'Tech & AI',
  },
  {
    question: 'Will the US enter a recession in 2026?',
    polymarket: 41, kalshi: 35, edge: 6, difference: 6,
    totalCost: 94, verified: true, isArbSafe: true,
    matchConfidence: 90, matchReason: 'Same economic event',
    volume: '$11.5M', endDate: '2026-12-31', category: 'Economics',
  },
  {
    question: 'Will SpaceX Starship reach orbit before April 2026?',
    polymarket: 73, kalshi: 68, edge: 5, difference: 5,
    totalCost: 95, verified: true, isArbSafe: true,
    matchConfidence: 82, matchReason: 'Same mission milestone',
    volume: '$5.3M', endDate: '2026-04-01', category: 'Science & Space',
  },
]

// Skeleton row for loading state
function SkeletonRow() {
  return (
    <div className="mt-row mt-skeleton-row">
      <div className="mt-col-market"><div className="mt-skeleton mt-skeleton-text" /></div>
      <div className="mt-col-price"><div className="mt-skeleton mt-skeleton-num" /></div>
      <div className="mt-col-price"><div className="mt-skeleton mt-skeleton-num" /></div>
      <div className="mt-col-num"><div className="mt-skeleton mt-skeleton-num" /></div>
      <div className="mt-col-num"><div className="mt-skeleton mt-skeleton-num" /></div>
      <div className="mt-col-ai"><div className="mt-skeleton mt-skeleton-badge" /></div>
      <div className="mt-col-date"><div className="mt-skeleton mt-skeleton-num" /></div>
      <div className="mt-col-vol"><div className="mt-skeleton mt-skeleton-num" /></div>
      <div className="mt-col-profit"><div className="mt-skeleton mt-skeleton-num" /></div>
    </div>
  )
}

export default function MarketTable({ initialMarkets, isPro, refreshInterval }) {
  const [markets, setMarkets] = useState(initialMarkets || [])
  const [loading, setLoading] = useState(!initialMarkets || initialMarkets.length === 0)
  const [search, setSearch] = useState('')
  const [confidenceFilter, setConfidenceFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortKey, setSortKey] = useState('difference')
  const [sortDir, setSortDir] = useState('desc')
  const [lastUpdated, setLastUpdated] = useState(initialMarkets?.length > 0 ? new Date() : null)
  const [lastUpdatedDisplay, setLastUpdatedDisplay] = useState('')
  const [countdown, setCountdown] = useState(refreshInterval || 60)
  const [refreshing, setRefreshing] = useState(false)
  const [communityVerified, setCommunityVerified] = useState(new Set())
  const [communityRejected, setCommunityRejected] = useState(new Map())
  const [arbCount, setArbCount] = useState(0)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [freeDismissed, setFreeDismissed] = useState(new Set())
  const [stake, setStake] = useState(1000)
  const [warming, setWarming] = useState(false)
  const hasFetched = useRef(false)
  const warmingPoll = useRef(null)

  useEffect(() => {
    setCommunityVerified(loadSet(VERIFIED_KEY))
    setCommunityRejected(loadMap(REJECTED_KEY))
  }, [])

  // Count arbs with a positive edge for the banner
  useEffect(() => {
    const count = markets.filter(m => m.edge > 0).length
    setArbCount(count)
  }, [markets])

  // Update "last updated" display every second
  useEffect(() => {
    if (!lastUpdated) return
    setLastUpdatedDisplay(formatTimeAgo(lastUpdated))
    const tick = setInterval(() => {
      setLastUpdatedDisplay(formatTimeAgo(lastUpdated))
    }, 1000)
    return () => clearInterval(tick)
  }, [lastUpdated])

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
      const res = await fetch('/api/markets?confidence=all&limit=200')
      const data = await res.json()
      if (data.markets) {
        setMarkets(data.markets)
        const serverTime = data.meta?.lastUpdated ? new Date(data.meta.lastUpdated) : new Date()
        setLastUpdated(serverTime)
        setCountdown(refreshInterval || 60)
        if (data.markets.length > 0) setLoading(false)

        const isWarming = data.meta?.warming && data.markets.length === 0
        setWarming(isWarming)

        if (isWarming && !warmingPoll.current) {
          warmingPoll.current = setInterval(async () => {
            try {
              const r = await fetch('/api/markets?confidence=all&limit=200')
              const d = await r.json()
              if (d.markets?.length > 0) {
                setMarkets(d.markets)
                setLastUpdated(d.meta?.lastUpdated ? new Date(d.meta.lastUpdated) : new Date())
                setLoading(false)
                setWarming(false)
                clearInterval(warmingPoll.current)
                warmingPoll.current = null
              }
            } catch {}
          }, 3000)
        } else if (!isWarming && warmingPoll.current) {
          clearInterval(warmingPoll.current)
          warmingPoll.current = null
        }

        if (!data.meta?.warming && data.markets.length === 0) {
          setLoading(false)
        }
      }
    } catch {
      setLoading(false)
    }
    if (manual) setRefreshing(false)
  }, [refreshInterval])

  // Fetch on mount — returns instantly from disk cache or triggers warming poll
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true
    fetchMarkets()
    return () => {
      if (warmingPoll.current) {
        clearInterval(warmingPoll.current)
        warmingPoll.current = null
      }
    }
  }, [fetchMarkets])

  // Auto-refresh interval for pro users
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
  const enrichedMarkets = useMemo(() => markets.map(m => {
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
  }), [markets, communityVerified, communityRejected])

  const categories = useMemo(() => {
    const cats = new Set()
    for (const m of enrichedMarkets) {
      if (m.category) cats.add(m.category)
    }
    return ['all', ...Array.from(cats).sort()]
  }, [enrichedMarkets])

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase()
    return enrichedMarkets
      .filter(m => {
        if (m.communityRejected) return false
        if (search && !m.question.toLowerCase().includes(searchLower) &&
            !(m._kalshiQuestion && m._kalshiQuestion.toLowerCase().includes(searchLower))) return false
        if (confidenceFilter !== 'all') {
          const score = m.matchConfidence ?? m.aiConfidence ?? 0
          if (score < Number(confidenceFilter)) return false
        }
        if (categoryFilter !== 'all' && m.category !== categoryFilter) return false
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
        } else if (sortKey === 'matchConfidence') {
          aVal = a.matchConfidence ?? a.aiConfidence ?? -1
          bVal = b.matchConfidence ?? b.aiConfidence ?? -1
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
  }, [enrichedMarkets, search, confidenceFilter, categoryFilter, sortKey, sortDir])

  const lockedSorts = isPro ? [] : ['polymarket', 'kalshi', 'difference', 'matchConfidence']

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

  const freeEligible = isPro ? [] : filtered.filter(m => m.edge != null && m.edge >= 1 && (m.matchConfidence ?? m.aiConfidence ?? 0) >= 40 && !freeDismissed.has(m.question))
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
          placeholder="Search markets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={confidenceFilter}
          onChange={(e) => isPro && setConfidenceFilter(e.target.value)}
          disabled={!isPro}
          title={!isPro ? 'Upgrade to Pro to filter by confidence' : ''}
          style={!isPro ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
        >
          <option value="all">All confidence</option>
          <option value="30">Match ≥ 30%</option>
          <option value="50">Match ≥ 50%</option>
          <option value="65">Match ≥ 65%</option>
          <option value="80">Match ≥ 80%</option>
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
          {lastUpdatedDisplay && (
            <span className="refresh-age"> · Updated {lastUpdatedDisplay}</span>
          )}
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

      {categories.length > 2 && (
        <div className="category-chips">
          {categories.map(cat => (
            <button
              key={cat}
              className={`category-chip ${categoryFilter === cat ? 'category-chip-active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>
      )}

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
            <div className={`mt-col-ai ${sortKey === 'matchConfidence' ? 'mt-sorted' : ''} ${lockedSorts.includes('matchConfidence') ? 'mt-locked' : ''}`} onClick={() => handleSort('matchConfidence')}>
              Match {sortArrow('matchConfidence')}
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

          {/* Body */}
          <div className="mt-body">
            {(loading || warming) && visibleRows.length === 0 && (
              <>
                <div className="mt-warming">
                  <div className="mt-warming-spinner" />
                  <span>{warming ? 'Scanning markets — data arrives in seconds...' : 'Loading...'}</span>
                </div>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </>
            )}
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
            {!loading && blurredRows.map((m, i) => (
              <MarketRow
                key={`blur-${i}`}
                market={m}
                blurred
                stake={stake}
                isLast={i === blurredRows.length - 1}
              />
            ))}
            {!loading && !warming && filtered.length === 0 && visibleRows.length === 0 && (
              <div className="mt-empty">
                {search || confidenceFilter !== 'all' || categoryFilter !== 'all'
                  ? 'No matches for current filters — try broadening your search'
                  : 'No arbitrage opportunities found right now'}
              </div>
            )}
          </div>
        </div>

        {!loading && showOverlay && <UpgradeOverlay count={filtered.length - FREE_LIMIT} />}
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
            <Link href="/signup" className="arb-banner-btn">Try free</Link>
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
  const matchConf = m.matchConfidence ?? m.aiConfidence ?? 0
  const isPossibleMatch = !isVerified && matchConf >= 30 && matchConf < 45
  const edgeClass = !hasEdge
    ? 'spread-unverified'
    : (isVerified || matchConf >= 50)
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
            {m._kalshiQuestion && m._kalshiQuestion !== m.question && (
              <span className="mt-kalshi-question">{m._kalshiQuestion}</span>
            )}
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

        {/* Match Confidence */}
        <div className="mt-col-ai">
          <MatchConfidenceBadge score={m.matchConfidence} aiScore={m.aiConfidence} reason={m.matchReason || m.aiReason} />
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
          {hasEdge && (isVerified || matchConf >= 45) ? (
            <span className={`mt-profit-value ${isArbSafe ? '' : 'mt-profit-unconfirmed'}`}>
              ${Math.round(stake * m.edge / 100)}
            </span>
          ) : hasEdge ? (
            <span className="mt-muted" title="Low confidence — verify before trading">{m.edge}¢</span>
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

function MatchConfidenceBadge({ score, aiScore, reason }) {
  const display = score ?? aiScore
  if (display == null) {
    return <span className="ai-badge ai-badge-none">—</span>
  }

  let cls
  if (display >= 80) cls = 'ai-badge-high'
  else if (display >= 50) cls = 'ai-badge-medium'
  else cls = 'ai-badge-low'

  const tooltip = reason || ''

  return (
    <span className={`ai-badge ${cls}`} title={tooltip}>
      {display}%
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
