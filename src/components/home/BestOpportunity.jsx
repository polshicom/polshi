'use client'

import { useState, useEffect } from 'react'

function parseVolume(volStr) {
  if (!volStr || typeof volStr !== 'string') return 0
  const cleaned = volStr.replace(/[$,]/g, '')
  if (cleaned.endsWith('M')) return parseFloat(cleaned) * 1_000_000
  if (cleaned.endsWith('K')) return parseFloat(cleaned) * 1_000
  if (cleaned.endsWith('B')) return parseFloat(cleaned) * 1_000_000_000
  return parseFloat(cleaned) || 0
}

function formatUsd(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export default function BestOpportunity() {
  const [best, setBest] = useState(null)

  useEffect(() => {
    fetch('/api/markets?confidence=all&limit=5')
      .then(r => r.json())
      .then(data => {
        const markets = data.markets || []
        const safe = markets.filter(m => (m.isArbSafe || m.verified) && m.edge > 0)
        if (safe.length > 0) setBest(safe[0])
      })
      .catch(() => {})
  }, [])

  if (!best) return null

  const profitPer1K = Math.round(best.edge * 10)
  const volume = parseVolume(best.volume)

  return (
    <section className="best-opp-section">
      <a href="/arbitrage" className="best-opp">
        <div className="best-opp-label">
          <span className="best-opp-dot" />
          Best Opportunity Right Now
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
          {volume > 0 && (
            <div className="best-opp-metric">
              <span className="best-opp-metric-label">Volume</span>
              <span className="best-opp-volume">{formatUsd(volume)}</span>
            </div>
          )}
        </div>

        <span className="best-opp-cta">
          View in Scanner
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </span>
      </a>
    </section>
  )
}
