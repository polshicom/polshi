'use client'

import { useState, useEffect } from 'react'

function formatEndDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d)) return null
  const days = Math.floor((d - Date.now()) / 86400000)
  if (days < 0) return 'Ended'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 30) return `${days}d`
  return `${Math.floor(days / 30)}mo`
}

function GapBar({ poly, kalshi, gap }) {
  const maxGap = 30 // cap visual at 30¢ for proportional bars
  const pct = Math.min(100, Math.round((gap / maxGap) * 100))
  const polyLower = poly < kalshi
  return (
    <div className="diff-gap-bar-wrap">
      <span className={`diff-price ${polyLower ? 'diff-price-lower' : ''}`}>{poly}¢</span>
      <div className="diff-gap-bar">
        <div className="diff-gap-fill" style={{ width: `${pct}%` }} />
        <span className="diff-gap-label">{gap}¢</span>
      </div>
      <span className={`diff-price ${!polyLower ? 'diff-price-lower' : ''}`}>{kalshi}¢</span>
    </div>
  )
}

function SkeletonRow() {
  return (
    <div className="diff-row diff-row-skeleton">
      <div className="diff-row-main">
        <div className="em-skel" style={{ marginBottom: 6 }} />
        <div className="em-skel em-skel-sm" />
      </div>
      <div className="diff-gap-bar-wrap">
        <div className="em-skel em-skel-xs" />
        <div className="diff-gap-bar"><div className="em-skel" style={{ height: '100%' }} /></div>
        <div className="em-skel em-skel-xs" />
      </div>
      <div className="em-skel em-skel-sm" />
    </div>
  )
}

const FILTERS = [
  { label: 'All', value: 0 },
  { label: '2¢+', value: 2 },
  { label: '5¢+', value: 5 },
  { label: '10¢+', value: 10 },
]

export default function DifferencesPage() {
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [minGap, setMinGap] = useState(0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/markets?confidence=all&limit=200')
      .then(r => r.json())
      .then(data => {
        const list = (data.markets || [])
          .filter(m => m.polymarket != null && m.kalshi != null)
          .map(m => ({ ...m, gap: Math.abs(m.polymarket - m.kalshi) }))
          .sort((a, b) => b.gap - a.gap)
        setMarkets(list)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = markets.filter(m => {
    if (m.gap < minGap) return false
    if (search && !m.question.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const maxGap = filtered.length > 0 ? filtered[0].gap : 1

  return (
    <>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Price Differences</h1>
          <p className="dashboard-subtitle">
            The biggest pricing gaps between Polymarket and Kalshi right now — sorted by spread.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="diff-filter-bar">
        <input
          className="em-search"
          type="text"
          placeholder="Search markets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="diff-gap-filters">
          {FILTERS.map(f => (
            <button
              key={f.value}
              className={`diff-gap-btn ${minGap === f.value ? 'diff-gap-btn-active' : ''}`}
              onClick={() => setMinGap(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="em-meta">
          {loading ? 'Loading…' : `${filtered.length} market${filtered.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Summary stat */}
      {!loading && filtered.length > 0 && (
        <div className="diff-summary">
          <div className="diff-summary-stat">
            <span className="diff-summary-val diff-summary-green">{filtered.filter(m => m.gap >= 5).length}</span>
            <span className="diff-summary-label">gaps ≥ 5¢</span>
          </div>
          <div className="diff-summary-divider" />
          <div className="diff-summary-stat">
            <span className="diff-summary-val">{filtered.filter(m => m.gap >= 2).length}</span>
            <span className="diff-summary-label">gaps ≥ 2¢</span>
          </div>
          <div className="diff-summary-divider" />
          <div className="diff-summary-stat">
            <span className="diff-summary-val diff-summary-green">{maxGap}¢</span>
            <span className="diff-summary-label">largest gap</span>
          </div>
        </div>
      )}

      {/* Market list */}
      <div className="diff-list">
        {/* Header row */}
        <div className="diff-list-header">
          <span>Market</span>
          <span className="diff-header-center">Poly · Gap · Kalshi</span>
          <span className="diff-header-right">Closes</span>
        </div>

        {loading
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
          : filtered.slice(0, 100).map((m, i) => {
              const profitPer1K = m.gap > 0 && m.isArbSafe ? `+$${Math.round(m.gap * 10)}` : null
              const slug = encodeURIComponent(
                m.question.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-').slice(0, 100)
              )
              const endDate = formatEndDate(m.endDate)
              return (
                <a key={i} href={`/market/${slug}`} className="diff-row">
                  <div className="diff-row-main">
                    <span className="diff-question">
                      {m.question.length > 80 ? m.question.slice(0, 80) + '…' : m.question}
                    </span>
                    <span className="diff-row-tags">
                      {m.category && <span className="em-tag em-tag-cat">{m.category}</span>}
                      {profitPer1K && <span className="diff-profit-tag">{profitPer1K} / $1k</span>}
                    </span>
                  </div>
                  <GapBar poly={m.polymarket} kalshi={m.kalshi} gap={m.gap} />
                  <span className="diff-closes">{endDate || '—'}</span>
                </a>
              )
            })
        }

        {!loading && filtered.length === 0 && (
          <div className="em-empty">No price differences found matching your filters</div>
        )}
      </div>
    </>
  )
}
