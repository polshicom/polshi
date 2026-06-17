'use client'

import { useState, useEffect, useCallback } from 'react'

function formatVolume(vol) {
  if (!vol || vol === 0) return null
  if (vol >= 1_000_000_000) return `$${(vol / 1_000_000_000).toFixed(1)}B`
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`
  return `$${Math.round(vol)}`
}

function formatEndDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d)) return null
  const days = Math.floor((d - Date.now()) / 86400000)
  if (days < 0) return 'Ended'
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days < 30) return `${days}d left`
  return `${Math.floor(days / 30)}mo left`
}

function ProbBar({ prob }) {
  const pct = Math.max(1, Math.min(99, prob ?? 50))
  const isHigh = pct >= 70
  const isLow = pct <= 30
  const color = isHigh ? '#10b981' : isLow ? '#ef4444' : '#5e6ad2'

  return (
    <div className="mc-prob-wrap">
      <div className="mc-prob-track">
        <div className="mc-prob-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="mc-prob-labels">
        <span className="mc-prob-yes" style={{ color }}>YES {pct}%</span>
        <span className="mc-prob-no">NO {100 - pct}%</span>
      </div>
    </div>
  )
}

function MarketCard({ market }) {
  const vol = formatVolume(market.volume)
  const endDate = formatEndDate(market.endDate)

  return (
    <a
      href={market.url || '#'}
      target={market.url ? '_blank' : undefined}
      rel="noopener noreferrer"
      className="mc-card"
    >
      <div className="mc-card-top">
        <div className="mc-tags">
          {market.category && market.category !== 'Other' && (
            <span className="mc-tag-cat">{market.category}</span>
          )}
          <span className={`mc-tag-platform ${market.platform === 'polymarket' ? 'mc-tag-poly' : 'mc-tag-kalshi'}`}>
            {market.platform === 'polymarket' ? 'Polymarket' : 'Kalshi'}
          </span>
        </div>
        {endDate && <span className="mc-closes">{endDate}</span>}
      </div>

      <p className="mc-question">{market.question}</p>

      <ProbBar prob={market.prob} />

      {vol && (
        <div className="mc-footer">
          <span className="mc-vol-label">Volume</span>
          <span className="mc-vol-val">{vol}</span>
        </div>
      )}
    </a>
  )
}

function SkeletonCard() {
  return (
    <div className="mc-card mc-card-skeleton">
      <div className="em-skel" style={{ width: '60%', marginBottom: 12 }} />
      <div className="em-skel" style={{ marginBottom: 6 }} />
      <div className="em-skel" style={{ width: '80%', marginBottom: 20 }} />
      <div className="em-skel" style={{ height: 8, borderRadius: 4, marginBottom: 8 }} />
      <div className="em-skel" style={{ width: '40%', height: 12 }} />
    </div>
  )
}

const CATEGORIES = ['All', 'US Politics', 'World Politics', 'Economics', 'Crypto', 'Tech & AI', 'Sports', 'Business', 'Science & Space']

export default function MarketCards({ initialMarkets, isPro }) {
  const [markets, setMarkets] = useState(initialMarkets || [])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [platform, setPlatform] = useState('all')
  const [loading, setLoading] = useState(!initialMarkets || initialMarkets.length === 0)

  const fetchMarkets = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ sort: 'volume', limit: isPro ? '500' : '200' })
      const res = await fetch(`/api/explore?${params}`)
      const data = await res.json()
      if (data.markets) setMarkets(data.markets)
    } catch {}
    setLoading(false)
  }, [isPro])

  useEffect(() => { fetchMarkets() }, [fetchMarkets])

  const filtered = markets.filter(m => {
    if (platform !== 'all' && m.platform !== platform) return false
    if (category !== 'All' && m.category !== category) return false
    if (search && !m.question.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <>
      <div className="mc-cat-bar">
        {CATEGORIES.map(c => (
          <button
            key={c}
            className={`mc-cat-btn ${category === c ? 'mc-cat-btn-active' : ''}`}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="em-filter-bar" style={{ paddingTop: 0 }}>
        <input
          className="em-search"
          type="text"
          placeholder="Search markets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="wt-platform-tabs">
          {['all', 'polymarket', 'kalshi'].map(p => (
            <button
              key={p}
              className={`wt-tab ${platform === p ? 'wt-tab-active' : ''}`}
              onClick={() => setPlatform(p)}
            >
              {p === 'all' ? 'All' : p === 'polymarket' ? 'Polymarket' : 'Kalshi'}
            </button>
          ))}
        </div>
        <span className="em-meta">
          {loading ? 'Loading…' : `${filtered.length} markets`}
        </span>
      </div>

      <div className="mc-grid">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
          : filtered.slice(0, 100).map((m, i) => <MarketCard key={i} market={m} />)
        }
        {!loading && filtered.length === 0 && (
          <div className="em-empty" style={{ gridColumn: '1/-1' }}>No markets found</div>
        )}
      </div>
    </>
  )
}
