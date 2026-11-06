'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'

// Best-effort label for a market within an event group — e.g. pull
// "Bernie Sanders" out of "Will Bernie Sanders win the 2028 Democratic
// presidential nomination?" so grouped cards can show just the outcome
// name instead of repeating the whole question each time.
function extractOutcomeLabel(question, eventTitle) {
  const eventWords = new Set((eventTitle || '').toLowerCase().split(/\s+/))
  const nameMatch = question.match(/\b([A-Z][a-zA-Z.]*(?:\s+[A-Z][a-zA-Z.]*)+)\b/)
  if (nameMatch) {
    const candidate = nameMatch[1]
    const candidateWords = candidate.toLowerCase().split(/\s+/)
    // Skip if the "name" we grabbed is actually just words from the event title
    if (!candidateWords.every(w => eventWords.has(w))) return candidate
  }
  return question.length > 50 ? question.slice(0, 50) + '…' : question
}

function formatEndDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d)) return null
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

export default function MarketCards({ initialMarkets, categories: initialCategories, isPro }) {
  const [markets, setMarkets] = useState(initialMarkets || [])
  const [categories, setCategories] = useState(initialCategories || [])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('default')
  const [loading, setLoading] = useState(false)

  const fetchMarkets = useCallback(async () => {
    setLoading(true)
    try {
      const limit = isPro ? '1000' : '300'
      const params = new URLSearchParams({ category, sort: sortBy, limit })
      if (search) params.set('q', search)
      const res = await fetch(`/api/explore-matched?${params}`)
      const data = await res.json()
      if (data.markets) {
        setMarkets(data.markets)
        if (data.meta?.categories) setCategories(data.meta.categories)
      }
    } catch {}
    setLoading(false)
  }, [category, sortBy, search, isPro])

  useEffect(() => {
    const timeout = setTimeout(fetchMarkets, 300)
    return () => clearTimeout(timeout)
  }, [fetchMarkets])

  // Group matches that belong to the same multi-outcome event (e.g. all the
  // candidates in "Democratic Presidential Nominee 2028") so they display
  // as one unit instead of N separate, hard-to-compare cards.
  const { groups, standalone } = useMemo(() => {
    const byEvent = new Map()
    const singles = []
    for (const m of markets) {
      if (!m.eventTitle) {
        singles.push(m)
        continue
      }
      if (!byEvent.has(m.eventTitle)) byEvent.set(m.eventTitle, [])
      byEvent.get(m.eventTitle).push(m)
    }
    const groupList = []
    for (const [title, members] of byEvent) {
      if (members.length < 2) {
        singles.push(members[0])
        continue
      }
      members.sort((a, b) => (b.edge || 0) - (a.edge || 0))
      groupList.push({ title, members })
    }
    groupList.sort((a, b) => (b.members[0]?.edge || 0) - (a.members[0]?.edge || 0))
    return { groups: groupList, standalone: singles }
  }, [markets])

  return (
    <>
      <div className="explore-filters">
        <input
          type="text"
          className="explore-search"
          placeholder="Search matched markets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="explore-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          className="explore-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="default">Sort: Best Match</option>
          <option value="edge">Sort: Spread</option>
          <option value="endDate">Sort: Ending Soon</option>
        </select>
      </div>

      <div className="explore-meta">
        {loading ? 'Loading...' : `${markets.length} matched markets`}
      </div>

      {groups.map((g, i) => (
        <EventGroupCard key={`group-${i}`} title={g.title} members={g.members} />
      ))}

      <div className="explore-grid">
        {standalone.map((m, i) => (
          <MatchedMarketCard key={i} market={m} />
        ))}
        {!loading && markets.length === 0 && (
          <div className="explore-empty">No matched markets found</div>
        )}
      </div>
    </>
  )
}

function EventGroupCard({ title, members }) {
  const [expanded, setExpanded] = useState(true)
  const bestEdge = members[0]?.edge || 0

  return (
    <div className="explore-event-group">
      <button className="explore-event-group-header" onClick={() => setExpanded(e => !e)}>
        <div className="explore-event-group-title-wrap">
          <span className="explore-event-group-title">{title}</span>
          <span className="explore-event-group-count">{members.length} outcomes</span>
        </div>
        <div className="explore-event-group-meta">
          {bestEdge > 0 && <span className="explore-event-group-best">Best spread {bestEdge}¢</span>}
          <svg className={`explore-event-group-chevron ${expanded ? 'open' : ''}`} width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>
      {expanded && (
        <div className="explore-event-group-body">
          {members.map((m, i) => (
            <EventGroupRow key={i} market={m} eventTitle={title} />
          ))}
        </div>
      )}
    </div>
  )
}

function EventGroupRow({ market: m, eventTitle }) {
  const label = extractOutcomeLabel(m.question, eventTitle)
  const hasEdge = m.edge != null && m.edge > 0

  return (
    <div className="explore-event-group-row" title={m.question}>
      <span className="explore-event-group-row-label">{label}</span>
      <div className="explore-event-group-row-prices">
        <span className="badge-poly-text">{m.polymarket}¢</span>
        <span className="explore-event-group-row-sep">vs</span>
        <span className="badge-kalshi-text">{m.kalshi}¢</span>
      </div>
      <span className={`explore-event-group-row-edge ${hasEdge ? 'has-edge' : ''}`}>
        {hasEdge ? `${m.edge}¢` : '—'}
      </span>
      <div className="explore-event-group-row-links">
        {m.polymarketUrl && (
          <a href={m.polymarketUrl} target="_blank" rel="noopener noreferrer" className="explore-link badge-poly-text">↗</a>
        )}
        {m.kalshiUrl && (
          <a href={m.kalshiUrl} target="_blank" rel="noopener noreferrer" className="explore-link badge-kalshi-text">↗</a>
        )}
      </div>
    </div>
  )
}

function MatchedMarketCard({ market: m }) {
  const endDate = formatEndDate(m.endDate)

  return (
    <div className="explore-card">
      <div className="explore-card-header">
        <span className="explore-badge badge-poly">Polymarket</span>
        <span className="explore-badge badge-kalshi">Kalshi</span>
        <span className="explore-category">{m.category}</span>
      </div>

      <div className="explore-card-question">{m.question}</div>
      {m._kalshiQuestion && m._kalshiQuestion !== m.question && (
        <div className="explore-card-kalshi-q">{m._kalshiQuestion}</div>
      )}

      <div className="explore-card-prices">
        <div className="explore-price-row">
          <span className="explore-price-platform badge-poly-text">Poly</span>
          <span className="explore-price-value">{m.polymarket}¢</span>
        </div>
        <div className="explore-price-row">
          <span className="explore-price-platform badge-kalshi-text">Kalshi</span>
          <span className="explore-price-value">{m.kalshi}¢</span>
        </div>
      </div>

      <div className="explore-card-footer">
        <div className="explore-spread">
          <span className="explore-spread-value">{m.edge}¢</span>
          <span className="explore-spread-label">spread</span>
        </div>
        <div className="explore-card-meta">
          <span className="explore-volume">{m.volume}</span>
          {endDate && <span className="explore-end">{endDate}</span>}
        </div>
      </div>

      <div className="explore-card-links">
        {m.polymarketUrl && (
          <a href={m.polymarketUrl} target="_blank" rel="noopener noreferrer" className="explore-link badge-poly-text">
            Polymarket ↗
          </a>
        )}
        {m.kalshiUrl && (
          <a href={m.kalshiUrl} target="_blank" rel="noopener noreferrer" className="explore-link badge-kalshi-text">
            Kalshi ↗
          </a>
        )}
      </div>
    </div>
  )
}
