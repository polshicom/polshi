'use client'

import { useState, useEffect } from 'react'

function formatTimeAgo(isoStr) {
  if (!isoStr) return ''
  const seconds = Math.round((Date.now() - new Date(isoStr).getTime()) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
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

  if (!loaded) return <div className="hp-whale-skeleton" />
  if (!whale) return null

  const isWhale = whale.dollarValue >= 50000
  const title = isWhale ? 'Whale of the Day' : 'Largest Trade Today'
  const sideIsYes = whale.side?.toUpperCase() === 'YES'
  const sizeLabel = whale.dollarValue >= 10000 ? 'Large' : 'Big'
  const contextLine = `${sizeLabel} ${whale.side?.toUpperCase() || '?'} position on ${whale.market?.length > 60 ? whale.market.slice(0, 60) + '…' : whale.market}`

  return (
    <section className="hp-whale-section">
      <div className="hp-section-wrap">
        <div className="hp-section-label">
          <span className="hp-section-dot" />
          {title}
        </div>
        <a href="/whales" className="hp-whale-card">
          <div className="hp-whale-left">
            <div className="hp-whale-icon" aria-hidden="true">🐋</div>
            <div className={`hp-whale-side ${sideIsYes ? 'hp-whale-side-yes' : 'hp-whale-side-no'}`}>
              {whale.side?.toUpperCase() || '?'}
            </div>
          </div>
          <div className="hp-whale-body">
            <p className="hp-whale-market">
              {whale.market?.length > 80 ? whale.market.slice(0, 80) + '…' : whale.market}
            </p>
            <p className="hp-whale-context">{contextLine}</p>
          </div>
          <div className="hp-whale-right">
            <span className="hp-whale-value">{whale.dollarFormatted}</span>
            <div className="hp-whale-meta">
              <span className={`hp-tag ${whale.platform === 'polymarket' ? 'hp-tag-poly' : 'hp-tag-kalshi'}`}>
                {whale.platform === 'polymarket' ? 'Polymarket' : 'Kalshi'}
              </span>
              {whale.time && <span className="hp-muted-time">{formatTimeAgo(whale.time)}</span>}
            </div>
          </div>
        </a>
      </div>
    </section>
  )
}
