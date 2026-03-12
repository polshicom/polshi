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
    Promise.all([
      fetch('/api/explore?limit=1').then(r => r.json()),
      fetch('/api/scanner-stats').then(r => r.json()),
    ])
      .then(([exploreRes, statsRes]) => {
        const pt = exploreRes.meta?.platformTotals || {}
        const poly = pt.polymarket || {}
        const kalshi = pt.kalshi || {}
        setData({
          polyCount: poly.count || 0,
          kalshiCount: kalshi.count || 0,
          polyVol: formatVol(poly.volume || 0),
          kalshiVol: formatVol(kalshi.volume || 0),
          arbCount: statsRes.arbCount || 0,
          scanned: statsRes.scanned || 0,
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
            <span className="dominance-vol">{data.polyVol}</span>
          </div>
          <div className="dominance-center">
            <span className="dominance-arb-count">{data.arbCount}</span>
            <span className="dominance-arb-label">matched markets</span>
          </div>
          <div className="dominance-col">
            <span className="badge-kalshi">Kalshi</span>
            <span className="dominance-count">{data.kalshiCount}</span>
            <span className="dominance-label">markets</span>
            <span className="dominance-vol">{data.kalshiVol}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
