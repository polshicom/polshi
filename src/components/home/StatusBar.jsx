'use client'

import { useState, useEffect, useRef } from 'react'

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

export default function StatusBar() {
  const [stats, setStats] = useState(null)
  const [secondsAgo, setSecondsAgo] = useState(0)
  const lastFetch = useRef(Date.now())

  function processMarkets(data) {
    const markets = data.markets || []
    const safe = markets.filter(m => m.isArbSafe && m.edge > 0)
    let totalEdge = 0
    for (const m of safe) {
      totalEdge += (m.edge / 100) * parseVolume(m.volume)
    }
    const totalScanned = data.meta?.total || markets.length
    setStats({
      scanned: totalScanned,
      arbCount: safe.length,
      totalEdge,
    })
    lastFetch.current = Date.now()
    setSecondsAgo(0)
  }

  useEffect(() => {
    // Initial fetch
    fetch('/api/markets?confidence=all&limit=100')
      .then(r => r.json())
      .then(processMarkets)
      .catch(() => {})

    // Poll every 20s
    const poll = setInterval(() => {
      fetch('/api/markets?confidence=all&limit=100')
        .then(r => r.json())
        .then(processMarkets)
        .catch(() => {})
    }, 20_000)

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
