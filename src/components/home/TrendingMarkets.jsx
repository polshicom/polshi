'use client'

import { useState, useEffect } from 'react'

function formatVolume(vol) {
  if (!vol) return ''
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`
  if (vol >= 1e3) return `$${(vol / 1e3).toFixed(1)}K`
  return `$${vol}`
}

function MarketCard({ market }) {
  const isPolymarket = market.platform === 'polymarket'
  const prob = market.probability != null ? Math.round(market.probability * 100) : null

  return (
    <div className="trending-card">
      <div className="trending-card-header">
        <span className={isPolymarket ? 'badge-polymarket' : 'badge-kalshi'}>
          {isPolymarket ? 'Polymarket' : 'Kalshi'}
        </span>
        {market.category && (
          <span className="trending-card-category">{market.category}</span>
        )}
        {market.volume > 0 && (
          <span className="trending-card-volume">{formatVolume(market.volume)}</span>
        )}
      </div>

      <h3 className="trending-card-title">{market.question}</h3>

      {prob !== null && (
        <div className="trending-card-outcomes">
          <span className="outcome-pill outcome-yes">
            Yes {prob}%
          </span>
          <span className="outcome-pill outcome-no">
            No {100 - prob}%
          </span>
        </div>
      )}

      <a href={`/explore?q=${encodeURIComponent(market.question?.split(' ').slice(0, 4).join(' ') || '')}`} className="trending-card-link">
        View market
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6" />
        </svg>
      </a>
    </div>
  )
}

export default function TrendingMarkets() {
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/explore?sort=volume&limit=12')
        const data = await res.json()
        setMarkets(data.markets || [])
      } catch {
        // fail silently
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <section className="trending-section">
      <h2 className="trending-heading">Hot markets right now</h2>

      {loading ? (
        <div className="trending-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="trending-card trending-card-skeleton" />
          ))}
        </div>
      ) : (
        <div className="trending-grid">
          {markets.slice(0, 12).map((m, i) => (
            <MarketCard key={i} market={m} />
          ))}
        </div>
      )}
    </section>
  )
}
