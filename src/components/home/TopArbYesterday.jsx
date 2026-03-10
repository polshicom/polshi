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

export default function TopArbYesterday() {
  const [best, setBest] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [timeAgo, setTimeAgo] = useState('')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/top-arb')
      .then(r => r.json())
      .then(data => {
        setBest(data.topArb || null)
        setLastUpdated(data.meta?.lastUpdated || null)
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  useEffect(() => {
    if (!lastUpdated) return
    setTimeAgo(formatTimeAgo(lastUpdated))
    const tick = setInterval(() => setTimeAgo(formatTimeAgo(lastUpdated)), 1000)
    return () => clearInterval(tick)
  }, [lastUpdated])

  if (!loaded) {
    return (
      <section className="best-opp-section">
        <div className="best-opp best-opp-skeleton">
          <div className="best-opp-label">
            <span className="best-opp-dot" />
            Top Arb of Yesterday
          </div>
          <div className="best-opp-skeleton-line best-opp-skeleton-wide" />
          <div className="best-opp-skeleton-prices">
            <div className="best-opp-skeleton-line best-opp-skeleton-med" />
            <div className="best-opp-skeleton-line best-opp-skeleton-med" />
          </div>
          <div className="best-opp-skeleton-line best-opp-skeleton-narrow" />
        </div>
      </section>
    )
  }

  if (!best) {
    return (
      <section className="best-opp-section">
        <div className="best-opp best-opp-empty">
          <div className="best-opp-label">
            <span className="best-opp-dot" />
            Top Arb of Yesterday
          </div>
          <p className="best-opp-fallback">No high-confidence arb right now</p>
          {timeAgo && <span className="best-opp-updated">Updated {timeAgo}</span>}
        </div>
      </section>
    )
  }

  const profitPer1K = Math.round(best.edge * 10)

  return (
    <section className="best-opp-section">
      <a href="/arbitrage" className="best-opp">
        <div className="best-opp-label">
          <span className="best-opp-dot" />
          Top Arb of Yesterday
        </div>

        <h3 className="best-opp-question">{best.question}</h3>

        <div className="best-opp-prices">
          <div className="best-opp-platform">
            <span className="best-opp-platform-name">Polymarket</span>
            <span className="best-opp-price">{best.polymarket}¢</span>
          </div>
          <div className="best-opp-vs">vs</div>
          <div className="best-opp-platform">
            <span className="best-opp-platform-name">Kalshi</span>
            <span className="best-opp-price">{best.kalshi}¢</span>
          </div>
        </div>

        <div className="best-opp-metrics">
          <div className="best-opp-metric">
            <span className="best-opp-metric-label">Edge</span>
            <span className="best-opp-edge">{best.edge}¢</span>
          </div>
          <div className="best-opp-metric">
            <span className="best-opp-metric-label">Profit per $1,000</span>
            <span className="best-opp-profit">${profitPer1K}</span>
          </div>
        </div>

        <div className="best-opp-footer">
          <span className="best-opp-cta">
            View in Scanner
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </span>
          {timeAgo && <span className="best-opp-updated">Updated {timeAgo}</span>}
        </div>
      </a>
    </section>
  )
}
