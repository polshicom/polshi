'use client'

import { useState, useEffect, useCallback } from 'react'

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
  const [platform, setPlatform] = useState('all')
  const [category, setCategory] = useState('all')
  const [sortBy, setSortBy] = useState('volume')
  const [loading, setLoading] = useState(false)

  const fetchMarkets = useCallback(async () => {
    setLoading(true)
    try {
      const limit = isPro ? '1000' : '300'
      const params = new URLSearchParams({ platform, category, sort: sortBy, limit })
      if (search) params.set('q', search)
      const res = await fetch(`/api/explore?${params}`)
      const data = await res.json()
      if (data.markets) {
        setMarkets(data.markets)
        if (data.meta?.categories) setCategories(data.meta.categories)
      }
    } catch {}
    setLoading(false)
  }, [platform, category, sortBy, search, isPro])

  useEffect(() => {
    const timeout = setTimeout(fetchMarkets, 300)
    return () => clearTimeout(timeout)
  }, [fetchMarkets])

  return (
    <>
      <div className="explore-filters">
        <input
          type="text"
          className="explore-search"
          placeholder="Search all markets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="explore-toggles">
          {['all', 'polymarket', 'kalshi'].map(p => (
            <button
              key={p}
              className={`explore-toggle ${platform === p ? 'active' : ''}`}
              onClick={() => setPlatform(p)}
            >
              {p === 'all' ? 'All' : p === 'polymarket' ? 'Polymarket' : 'Kalshi'}
            </button>
          ))}
        </div>
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
          <option value="volume">Sort: Volume</option>
          <option value="prob">Sort: Probability</option>
          <option value="endDate">Sort: Ending Soon</option>
        </select>
      </div>

      <div className="explore-meta">
        {loading ? 'Loading...' : `${markets.length} markets`}
      </div>

      <div className="explore-grid">
        {markets.map((m, i) => (
          <MarketCard key={i} market={m} />
        ))}
        {!loading && markets.length === 0 && (
          <div className="explore-empty">No markets found</div>
        )}
      </div>
    </>
  )
}

function MarketCard({ market: m }) {
  const platformClass = m.platform === 'polymarket' ? 'badge-poly' : 'badge-kalshi'
  const endDate = formatEndDate(m.endDate)

  return (
    <a
      href={m.url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="explore-card"
    >
      <div className="explore-card-header">
        <span className={`explore-badge ${platformClass}`}>
          {m.platform === 'polymarket' ? 'Polymarket' : 'Kalshi'}
        </span>
        <span className="explore-category">{m.category}</span>
      </div>

      <div className="explore-card-question">{m.question}</div>

      <div className="explore-card-footer">
        <div className="explore-prob">
          <span className="explore-prob-value">{m.prob}%</span>
          <span className="explore-prob-label">chance</span>
        </div>
        <div className="explore-card-meta">
          <span className="explore-volume">{m.volumeFormatted}</span>
          {endDate && <span className="explore-end">{endDate}</span>}
        </div>
      </div>
    </a>
  )
}
