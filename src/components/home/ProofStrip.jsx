'use client'

import { useState, useEffect } from 'react'

function formatProfit(totalEdge) {
  if (!totalEdge || totalEdge === 0) return '$0'
  if (totalEdge >= 1_000_000) return `$${(totalEdge / 1_000_000).toFixed(1)}M`
  if (totalEdge >= 1_000) return `$${(totalEdge / 1_000).toFixed(0)}K`
  return `$${Math.round(totalEdge)}`
}

function formatTimeAgo(isoStr) {
  if (!isoStr) return null
  const seconds = Math.round((Date.now() - new Date(isoStr).getTime()) / 1000)
  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  return `${minutes}m ago`
}

export default function ProofStrip() {
  const [stats, setStats] = useState(null)
  const [timeAgo, setTimeAgo] = useState('')

  useEffect(() => {
    fetch('/api/scanner-stats')
      .then(r => r.json())
      .then(data => setStats(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!stats?.lastUpdated) return
    setTimeAgo(formatTimeAgo(stats.lastUpdated))
    const tick = setInterval(() => setTimeAgo(formatTimeAgo(stats.lastUpdated)), 5000)
    return () => clearInterval(tick)
  }, [stats?.lastUpdated])

  const scanned = stats?.scanned ? stats.scanned.toLocaleString() : '—'
  const gaps = stats?.arbCount != null ? stats.arbCount.toString() : '—'
  const profit = stats?.totalEdge ? formatProfit(stats.totalEdge) : '—'

  return (
    <div className="hp-proof-strip">
      <div className="hp-proof-inner">
        <div className="hp-proof-stat">
          <span className="hp-proof-num">{scanned}</span>
          <span className="hp-proof-label">markets checked</span>
        </div>
        <span className="hp-proof-sep" aria-hidden="true" />
        <div className="hp-proof-stat">
          <span className="hp-proof-num">{gaps}</span>
          <span className="hp-proof-label">price gaps found</span>
        </div>
        <span className="hp-proof-sep" aria-hidden="true" />
        <div className="hp-proof-stat">
          <span className="hp-proof-num hp-proof-green">{profit}</span>
          <span className="hp-proof-label">profit available today</span>
        </div>
        <span className="hp-proof-sep" aria-hidden="true" />
        <div className="hp-proof-stat">
          <span className="hp-proof-num hp-proof-updated">
            <span className="hp-proof-fresh-dot" />
            {timeAgo || 'live'}
          </span>
          <span className="hp-proof-label">last updated</span>
        </div>
      </div>
    </div>
  )
}
