'use client'

import { useState, useEffect } from 'react'

function formatVolume(vol) {
  if (!vol) return '$0'
  if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`
  if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`
  if (vol >= 1e3) return `$${(vol / 1e3).toFixed(1)}K`
  return `$${vol.toFixed(0)}`
}

function SkeletonRow() {
  return (
    <div className="volume-row">
      <div className="vol-col-rank"><div className="em-skel em-skel-xs" /></div>
      <div className="vol-col-market"><div className="em-skel" style={{ marginBottom: 4 }} /><div className="em-skel em-skel-sm" /></div>
      <div className="vol-col-platform"><div className="em-skel em-skel-sm" /></div>
      <div className="vol-col-volume"><div className="em-skel em-skel-sm" /></div>
      <div className="vol-col-prob"><div className="em-skel em-skel-xs" /></div>
    </div>
  )
}

export default function VolumePage() {
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ total: 0, totalVolume: 0, avgVolume: 0 })

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/explore?sort=volume&limit=500')
        const data = await res.json()
        const list = data.markets || []
        const totalVolume = list.reduce((sum, m) => sum + (m.volume || 0), 0)
        setMarkets(list)
        setStats({
          total: list.length,
          totalVolume,
          avgVolume: list.length ? totalVolume / list.length : 0,
        })
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const top100 = markets.slice(0, 100)
  const maxVol = top100.length > 0 ? Math.max(...top100.map(m => m.volume || 0)) : 1

  return (
    <>
      <div className="dashboard-header">
        <div className="page-hero">
          <h1 className="dashboard-title">Volume Leaderboard</h1>
          <p className="dashboard-subtitle">
            Ranked by 24-hour trading volume. See which markets are pulling the most liquidity right now.
          </p>
        </div>
      </div>

      {/* Metric cards */}
      <div className="volume-metrics">
        <div className="volume-metric-card">
          <div className="volume-metric-value">
            {loading ? <div className="em-skel em-skel-sm" style={{ margin: '0 auto', height: 32, width: 80 }} /> : stats.total}
          </div>
          <div className="volume-metric-label">Markets Monitored</div>
        </div>
        <div className="volume-metric-card">
          <div className="volume-metric-value vol-metric-green">
            {loading ? <div className="em-skel em-skel-sm" style={{ margin: '0 auto', height: 32, width: 80 }} /> : formatVolume(stats.totalVolume)}
          </div>
          <div className="volume-metric-label">Total Volume</div>
        </div>
        <div className="volume-metric-card">
          <div className="volume-metric-value">
            {loading ? <div className="em-skel em-skel-sm" style={{ margin: '0 auto', height: 32, width: 80 }} /> : formatVolume(stats.avgVolume)}
          </div>
          <div className="volume-metric-label">Avg Market Volume</div>
        </div>
      </div>

      {/* Volume table */}
      <div className="volume-table-wrap">
        <div className="volume-table-header">
          <div className="vol-col-rank">#</div>
          <div className="vol-col-market">Market</div>
          <div className="vol-col-platform">Platform</div>
          <div className="vol-col-volume">Volume</div>
          <div className="vol-col-prob">Probability</div>
        </div>

        {loading
          ? Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
          : top100.map((m, i) => {
              const barPct = maxVol > 0 ? Math.round((m.volume || 0) / maxVol * 100) : 0
              const prob = m.prob != null ? `${Math.round(m.prob * 100)}%` : '—'
              return (
                <div key={i} className="volume-row">
                  <div className="vol-col-rank">{i + 1}</div>
                  <div className="vol-col-market">
                    <div className="vol-market-name">{m.question}</div>
                    {m.category && <span className="vol-market-cat">{m.category}</span>}
                  </div>
                  <div className="vol-col-platform">
                    <span className={m.platform === 'polymarket' ? 'badge-polymarket' : 'badge-kalshi'}>
                      {m.platform === 'polymarket' ? 'Poly' : 'Kalshi'}
                    </span>
                  </div>
                  <div className="vol-col-volume">
                    <span className="vol-amount">{formatVolume(m.volume)}</span>
                    <div className="vol-bar-wrap">
                      <div className="vol-bar" style={{ width: `${barPct}%` }} />
                    </div>
                  </div>
                  <div className="vol-col-prob">{prob}</div>
                </div>
              )
            })
        }
      </div>
    </>
  )
}
