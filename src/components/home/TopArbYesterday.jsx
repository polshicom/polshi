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

function getConfidence(aiConfidence) {
  if (aiConfidence >= 90) return { label: 'HIGH', cls: 'hp-badge-high' }
  if (aiConfidence >= 70) return { label: 'MED', cls: 'hp-badge-med' }
  return { label: 'LOW', cls: 'hp-badge-low' }
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

  if (!loaded) return <div className="hp-toparb-skeleton" />
  if (!best) return null

  const profitPer1K = Math.round(best.edge * 10)
  const conf = best.aiConfidence != null ? getConfidence(best.aiConfidence) : null
  const showDirection = best.buyPlatform && best.aiConfidence >= 90
  const dirLabel = best.buyPlatform === 'polymarket' ? 'Better price on Polymarket' : 'Better price on Kalshi'

  return (
    <section className="hp-toparb-section">
      <div className="hp-section-wrap">
        <div className="hp-section-label">
          <span className="hp-section-dot" />
          Best trade yesterday
        </div>
        <a href="/arbitrage" className="hp-toparb-card">
          <div className="hp-toparb-left">
            <h3 className="hp-toparb-question">
              {best.question.length > 100 ? best.question.slice(0, 100) + '…' : best.question}
            </h3>
            <div className="hp-toparb-meta">
              {best.category && (
                <span className="hp-tag hp-tag-category">{best.category.toUpperCase()}</span>
              )}
              <span className="hp-tag hp-tag-poly">Polymarket</span>
              <span className="hp-tag hp-tag-kalshi">Kalshi</span>
            </div>
            <p className="hp-toparb-desc">Two platforms, different prices on the same event.</p>
          </div>

          <div className="hp-toparb-right">
            <div className="hp-toparb-prices">
              <div className="hp-toparb-price-row">
                <span className="hp-toparb-price-label">Polymarket</span>
                <span className="hp-toparb-price-val">{best.polymarket}¢</span>
              </div>
              <div className="hp-toparb-price-row">
                <span className="hp-toparb-price-label">Kalshi</span>
                <span className="hp-toparb-price-val">{best.kalshi}¢</span>
              </div>
            </div>

            <div className="hp-toparb-divider" />

            <div className="hp-toparb-profit-block">
              <span className="hp-toparb-profit-label">Profit per $1,000</span>
              <span className="hp-toparb-profit-val">+${profitPer1K}</span>
            </div>

            <div className="hp-toparb-footer">
              {conf && <span className={`hp-badge ${conf.cls}`}>{conf.label}</span>}
              {showDirection && <span className="hp-toparb-direction">{dirLabel}</span>}
              {timeAgo && <span className="hp-muted-time">{timeAgo}</span>}
            </div>
          </div>
        </a>
      </div>
    </section>
  )
}
