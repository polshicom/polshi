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

export default function WhaleYesterday() {
  const [whale, setWhale] = useState(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/whale-yesterday')
      .then(r => r.json())
      .then(data => {
        setWhale(data.whale || null)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  if (!loaded) {
    return (
      <section className="whale-yesterday-section">
        <div className="whale-yesterday-card whale-yesterday-skeleton">
          <div className="best-opp-skeleton-line best-opp-skeleton-wide" />
          <div className="best-opp-skeleton-line best-opp-skeleton-narrow" />
        </div>
      </section>
    )
  }

  if (!whale) return null

  return (
    <section className="whale-yesterday-section">
      <div className="whale-yesterday-card">
        <div className="whale-yesterday-label">
          <span className="whale-yesterday-icon">&#x1F40B;</span>
          Whale of the Day
        </div>
        <h3 className="whale-yesterday-market">{whale.market}</h3>
        <div className="whale-yesterday-details">
          <span className={`badge-${whale.platform}`}>
            {whale.platform === 'polymarket' ? 'Polymarket' : 'Kalshi'}
          </span>
          <span className="whale-yesterday-value">{whale.dollarFormatted}</span>
          <span className="whale-yesterday-side">{whale.side}</span>
          {whale.whaleLabel && (
            <span className="whale-yesterday-tag">{whale.whaleLabel}</span>
          )}
        </div>
        <div className="whale-yesterday-footer">
          <a href="/whales" className="whale-yesterday-cta">
            View all whale trades
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </a>
          <span className="whale-yesterday-time">{formatTimeAgo(whale.time)}</span>
        </div>
      </div>
    </section>
  )
}
