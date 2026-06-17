'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

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

function formatEndDate(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  if (isNaN(d)) return null
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function ConfidenceBadge({ score }) {
  if (score == null) return null
  const cls = score >= 90 ? 'md-badge-high' : score >= 70 ? 'md-badge-med' : 'md-badge-low'
  const label = score >= 90 ? 'HIGH' : score >= 70 ? 'MED' : 'LOW'
  return <span className={`md-badge ${cls}`}>{label} · {score}%</span>
}

export default function MarketDetailPage() {
  const { id } = useParams()
  const [market, setMarket] = useState(null)
  const [trades, setTrades] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/market-detail?slug=${encodeURIComponent(id)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setNotFound(true)
        } else {
          setMarket(data.market)
          setTrades(data.relatedTrades || [])
        }
        setLoading(false)
      })
      .catch(() => { setNotFound(true); setLoading(false) })
  }, [id])

  if (loading) {
    return (
      <div className="md-loading">
        <div className="md-loading-card" />
        <div className="md-loading-card md-loading-card-sm" />
      </div>
    )
  }

  if (notFound || !market) {
    return (
      <div className="md-not-found">
        <h2>Market not found</h2>
        <p>This market may have closed or the link is outdated.</p>
        <a href="/arbitrage" className="md-back-btn">
          <BackIcon /> Back to Scanner
        </a>
      </div>
    )
  }

  const profitPer1K = market.edge != null ? Math.round(market.edge * 10) : null
  const endDate = formatEndDate(market.endDate)
  const showDirection = market.buyPlatform && market.aiConfidence >= 90
  const dirLabel = market.buyPlatform === 'polymarket' ? 'Better price on Polymarket' : 'Better price on Kalshi'

  const polyIsCheaper = market.polymarket < market.kalshi
  const kalshiIsCheaper = market.kalshi < market.polymarket

  return (
    <div className="md-page">
      {/* Back nav */}
      <div className="md-topbar">
        <a href="/arbitrage" className="md-back-btn">
          <BackIcon /> Back to Scanner
        </a>
        {market.category && (
          <span className="md-category">{market.category.toUpperCase()}</span>
        )}
        {endDate && (
          <span className="md-ends">Closes {endDate}</span>
        )}
      </div>

      {/* Title */}
      <h1 className="md-title">{market.question}</h1>

      {/* Price comparison hero */}
      <div className="md-price-hero">
        <div className={`md-price-box ${polyIsCheaper && market.edge > 0 ? 'md-price-box-best' : ''}`}>
          <span className="md-price-platform-label">Polymarket</span>
          <span className="md-price-value">{market.polymarket}¢</span>
          <span className="md-price-pct">{market.polymarket}% YES</span>
          {polyIsCheaper && market.edge > 0 && (
            <span className="md-price-tag">Better price</span>
          )}
          {market.polymarketUrl && (
            <a
              href={market.polymarketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="md-platform-link"
            >
              View on Polymarket
              <ExternalIcon />
            </a>
          )}
        </div>

        <div className="md-vs-col">
          <div className="md-vs-gap">
            <span className="md-gap-label">Price gap</span>
            <span className="md-gap-value">{market.edge != null ? `${market.edge}¢` : '—'}</span>
          </div>
          <span className="md-vs-label">vs</span>
        </div>

        <div className={`md-price-box ${kalshiIsCheaper && market.edge > 0 ? 'md-price-box-best' : ''}`}>
          <span className="md-price-platform-label">Kalshi</span>
          <span className="md-price-value">{market.kalshi}¢</span>
          <span className="md-price-pct">{market.kalshi}% YES</span>
          {kalshiIsCheaper && market.edge > 0 && (
            <span className="md-price-tag">Better price</span>
          )}
          {market.kalshiUrl && (
            <a
              href={market.kalshiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="md-platform-link"
            >
              View on Kalshi
              <ExternalIcon />
            </a>
          )}
        </div>
      </div>

      {/* Opportunity summary */}
      <div className="md-opportunity">
        <div className="md-opp-primary">
          <div className="md-opp-profit">
            <span className="md-opp-profit-label">Profit per $1,000</span>
            <span className="md-opp-profit-val">
              {profitPer1K != null ? `+$${profitPer1K}` : '—'}
            </span>
          </div>
          <div className="md-opp-meta">
            <ConfidenceBadge score={market.aiConfidence} />
            {showDirection && (
              <span className="md-direction">{dirLabel}</span>
            )}
            {market.volume && (
              <span className="md-volume">Vol: {market.volume}</span>
            )}
          </div>
        </div>

        {market.aiReason && (
          <div className="md-ai-reason">
            <span className="md-ai-reason-label">Match reasoning</span>
            <span className="md-ai-reason-text">{market.aiReason}</span>
          </div>
        )}
      </div>

      {/* Whale trades on this market */}
      {trades.length > 0 && (
        <div className="md-whales">
          <div className="md-section-label">
            <span className="md-section-dot" />
            Recent trades on this market
          </div>
          <div className="md-whale-list">
            {trades.map((t, i) => {
              const sideIsYes = t.side?.toUpperCase() === 'YES'
              return (
                <div key={i} className="md-whale-row">
                  <span className={`md-whale-side ${sideIsYes ? 'md-side-yes' : 'md-side-no'}`}>
                    {t.side?.toUpperCase() || '?'}
                  </span>
                  <span className="md-whale-value">{t.dollarFormatted}</span>
                  <span className={`em-tag ${t.platform === 'polymarket' ? 'em-tag-poly' : 'em-tag-kalshi'}`}>
                    {t.platform === 'polymarket' ? 'Poly' : 'Kalshi'}
                  </span>
                  <span className="md-whale-time">{formatTimeAgo(t.time)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No whales found */}
      {trades.length === 0 && (
        <div className="md-whales">
          <div className="md-section-label">
            <span className="md-section-dot" />
            Whale activity
          </div>
          <p className="md-no-whales">No large trades found on this market in the last 24 hours.</p>
        </div>
      )}
    </div>
  )
}

function BackIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}
