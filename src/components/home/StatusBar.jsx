'use client'

import { useState, useEffect, useRef } from 'react'

function formatUsd(n) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toFixed(0)}`
}

export default function StatusBar() {
  const [stats, setStats] = useState(null)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const lastFetch = useRef(Date.now())

  function processStats(data) {
    setStats({
      scanned: data.scanned || 0,
      arbCount: data.arbCount || 0,
      totalEdge: data.totalEdge || 0,
    })
    lastFetch.current = Date.now()
    setSecondsAgo(0)
  }

  useEffect(() => {
    // Initial fetch — lightweight stats-only endpoint
    fetch('/api/scanner-stats')
      .then(r => r.json())
      .then(processStats)
      .catch(() => {})

    // Poll every 30s (matches worker interval)
    const poll = setInterval(() => {
      fetch('/api/scanner-stats')
        .then(r => r.json())
        .then(processStats)
        .catch(() => {})
    }, 30_000)

    // Tick seconds
    const tick = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastFetch.current) / 1000))
    }, 1000)

    return () => { clearInterval(poll); clearInterval(tick) }
  }, [])

  if (!stats) return <div className="status-bar status-bar-loading" />

  return (
    <div className="status-bar">
      <div className="status-bar-inner">
        <span className="status-bar-live">
          <span className="status-bar-dot" />
          Live
        </span>
        <span className="status-bar-divider" />
        <span className="status-bar-stat">
          <strong>{stats.scanned}</strong> markets scanned
        </span>
        <span className="status-bar-divider" />
        <span className="status-bar-stat status-bar-arbs">
          <span className="status-bar-blurred"><strong>47</strong></span> arb opportunities
        </span>
        <span className="status-bar-divider" />
        <span className="status-bar-stat">
          Total edge: <strong className="status-bar-edge">{formatUsd(stats.totalEdge)}</strong>
        </span>
        <span className="status-bar-divider" />
        <span className="status-bar-stat status-bar-time">
          Updated {secondsAgo}s ago
        </span>
      </div>
    </div>
  )
}
