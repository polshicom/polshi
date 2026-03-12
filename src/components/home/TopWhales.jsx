'use client'

import { useState, useEffect } from 'react'

function formatTimeAgo(isoStr) {
  if (!isoStr) return ''
  const seconds = Math.round((Date.now() - new Date(isoStr).getTime()) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

export default function TopWhales() {
  const [whales, setWhales] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/whales?minSize=100')
      .then(r => r.json())
      .then(data => {
        const trades = data.trades || []
        trades.sort((a, b) => b.dollarValue - a.dollarValue)
        setWhales(trades.slice(0, 5))
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  if (!loaded) {
    return (
      <section className="top-whales-section">
        <div className="top-whales-card top-whales-skeleton">
          <div className="best-opp-skeleton-line best-opp-skeleton-wide" />
          <div className="best-opp-skeleton-line best-opp-skeleton-med" />
          <div className="best-opp-skeleton-line best-opp-skeleton-med" />
        </div>
      </section>
    )
  }

  if (whales.length === 0) return null

  return (
    <section className="top-whales-section">
      <div className="top-whales-card">
        <div className="top-whales-label">
          <span className="top-whales-icon">&#x1F40B;</span>
          Top Whale Purchases Today
        </div>
        <div className="top-whales-table">
          <div className="top-whales-header">
            <span>Market</span>
            <span>Platform</span>
            <span>Value</span>
            <span>Side</span>
            <span>Time</span>
          </div>
          {whales.map((w, i) => (
            <a key={i} href="/whales" className="top-whales-row">
              <span className="top-whales-market">
                {w.market.length > 35 ? w.market.slice(0, 35) + '...' : w.market}
              </span>
              <span className={`badge-${w.platform}`}>
                {w.platform === 'polymarket' ? 'Poly' : 'Kalshi'}
              </span>
              <span className="top-whales-value">{w.dollarFormatted}</span>
              <span className="top-whales-side">{w.side}</span>
              <span className="top-whales-time">{formatTimeAgo(w.time)}</span>
            </a>
          ))}
        </div>
        <div className="top-whales-footer">
          <a href="/whales" className="top-whales-cta">
            View all whale trades
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
