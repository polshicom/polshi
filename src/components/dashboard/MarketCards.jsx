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

      <div className="explore-grid">
        {markets.map((m, i) => (
          <MatchedMarketCard key={i} market={m} />
        ))}
        {!loading && markets.length === 0 && (
          <div className="explore-empty">No matched markets found</div>
        )}
      </div>
    </>
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
