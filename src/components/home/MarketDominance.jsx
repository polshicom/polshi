'use client'

import { useState, useEffect } from 'react'

function formatVol(vol) {
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`
  if (vol >= 1e3) return `$${(vol / 1e3).toFixed(0)}K`
  return `$${vol.toFixed(0)}`
}

export default function MarketDominance() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/explore?limit=500')
      .then(r => r.json())
      .then(res => {
        const markets = res.markets || []
        const poly = markets.filter(m => m.platform === 'polymarket')
        const kalshi = markets.filter(m => m.platform === 'kalshi')
        const polyVol = poly.reduce((s, m) => s + (m.volume || 0), 0)
        const kalshiVol = kalshi.reduce((s, m) => s + (m.volume || 0), 0)
        setData({
          polyCount: poly.length,
          kalshiCount: kalshi.length,
          polyVol: formatVol(polyVol),
          kalshiVol: formatVol(kalshiVol),
        })
      })
      .catch(() => {})
  }, [])

  if (!data) {
    return (
      <section className="dominance-section">
        <div className="dominance-card dominance-skeleton">
          <div className="dominance-col">
            <div className="best-opp-skeleton-line best-opp-skeleton-med" />
            <div className="best-opp-skeleton-line best-opp-skeleton-narrow" />
          </div>
          <div className="dominance-vs">vs</div>
          <div className="dominance-col">
            <div className="best-opp-skeleton-line best-opp-skeleton-med" />
            <div className="best-opp-skeleton-line best-opp-skeleton-narrow" />
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="dominance-section">
      <div className="dominance-card">
        <h2 className="dominance-heading">Market Coverage</h2>
        <div className="dominance-grid">
          <div className="dominance-col">
            <span className="badge-polymarket">Polymarket</span>
            <span className="dominance-count">{data.polyCount}</span>
            <span className="dominance-label">markets</span>
            <span className="dominance-vol">{data.polyVol} volume</span>
          </div>
          <div className="dominance-vs">vs</div>
          <div className="dominance-col">
            <span className="badge-kalshi">Kalshi</span>
            <span className="dominance-count">{data.kalshiCount}</span>
            <span className="dominance-label">markets</span>
            <span className="dominance-vol">{data.kalshiVol} volume</span>
          </div>
        </div>
      </div>
    </section>
  )
}
