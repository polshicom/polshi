'use client'

import { useState, useEffect, useCallback } from 'react'

const SIZE_OPTIONS = [
  { value: '0', label: 'All sizes' },
  { value: '100', label: '$100+' },
  { value: '500', label: '$500+' },
  { value: '1000', label: '$1K+' },
  { value: '5000', label: '$5K+' },
  { value: '10000', label: '$10K+' },
  { value: '25000', label: '$25K+' },
  { value: '50000', label: '$50K+' },
]

const FREE_VISIBLE = 3

const FAKE_WHALE_TRADES = [
  {
    time: new Date(Date.now() - 12000).toISOString(),
    platform: 'polymarket',
    market: 'Will the Fed cut rates in June 2026?',
    side: 'YES', outcome: 'Yes',
    price: 62, contracts: 8400, dollarFormatted: '$5.2K',
    whaleScore: 82, whaleLabel: 'Big Whale',
    trader: '0x8f2...d41', isRepeatWhale: true, walletTradeCount: 7, walletTotalFormatted: '$38K',
    url: null,
  },
  {
    time: new Date(Date.now() - 25000).toISOString(),
    platform: 'kalshi',
    market: 'Bitcoin above $150K before July 2026',
    side: 'NO', outcome: 'No',
    price: 71, contracts: 5200, dollarFormatted: '$3.7K',
    whaleScore: 68, whaleLabel: 'Notable',
    trader: null, isRepeatWhale: false,
    url: null,
  },
  {
    time: new Date(Date.now() - 40000).toISOString(),
    platform: 'polymarket',
    market: 'Will Tesla deliver Robotaxi in 2026?',
    side: 'YES', outcome: 'Yes',
    price: 24, contracts: 12000, dollarFormatted: '$2.9K',
    whaleScore: 55, whaleLabel: 'Notable',
    trader: '0xab3...f19', isRepeatWhale: false,
    url: null,
  },
  {
    time: new Date(Date.now() - 58000).toISOString(),
    platform: 'kalshi',
    market: 'US recession in 2026',
    side: 'YES', outcome: 'Yes',
    price: 38, contracts: 18500, dollarFormatted: '$7.0K',
    whaleScore: 91, whaleLabel: 'Mega Whale',
    trader: null, isRepeatWhale: false,
    url: null,
  },
  {
    time: new Date(Date.now() - 90000).toISOString(),
    platform: 'polymarket',
    market: 'Lakers win 2026 NBA Championship',
    side: 'NO', outcome: 'No',
    price: 88, contracts: 6100, dollarFormatted: '$5.4K',
    whaleScore: 75, whaleLabel: 'Big Whale',
    trader: '0x3c1...a82', isRepeatWhale: true, walletTradeCount: 4, walletTotalFormatted: '$22K',
    url: null,
  },
  {
    time: new Date(Date.now() - 130000).toISOString(),
    platform: 'kalshi',
    market: 'SpaceX Starship reaches orbit before April 2026',
    side: 'YES', outcome: 'Yes',
    price: 73, contracts: 9300, dollarFormatted: '$6.8K',
    whaleScore: 85, whaleLabel: 'Big Whale',
    trader: null, isRepeatWhale: false,
    url: null,
  },
]

function timeAgo(isoStr) {
  const seconds = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000)
  if (seconds < 0) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function WhaleTable({ isPro }) {
  const [trades, setTrades] = useState([])
  const [platform, setPlatform] = useState('all')
  const [minSize, setMinSize] = useState('1000')
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState(60)

  const fetchTrades = useCallback(async (showLoading = false) => {
    if (!isPro) return
    if (showLoading) setLoading(true)
    try {
      const params = new URLSearchParams({ platform, minSize })
      const res = await fetch(`/api/whales?${params}`)
      const data = await res.json()
      if (data.trades) {
        setTrades(data.trades)
        setCountdown(60)
      }
    } catch {}
    setLoading(false)
  }, [platform, minSize, isPro])

  useEffect(() => {
    if (isPro) {
      fetchTrades(true)
    } else {
      setLoading(false)
    }
  }, [fetchTrades, isPro])

  // Auto-refresh every 60s (pro only)
  useEffect(() => {
    if (!isPro) return
    const interval = setInterval(() => fetchTrades(false), 60_000)
    return () => clearInterval(interval)
  }, [fetchTrades, isPro])

  // Countdown
  useEffect(() => {
    if (!isPro) return
    const tick = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 60 : prev - 1))
    }, 1000)
    return () => clearInterval(tick)
  }, [isPro])

  // For free users, show fake demo data
  const displayTrades = isPro ? trades : FAKE_WHALE_TRADES
  const visibleTrades = isPro ? displayTrades : displayTrades.slice(0, FREE_VISIBLE)
  const blurredTrades = isPro ? [] : displayTrades.slice(FREE_VISIBLE)

  return (
    <>
      <div className="whale-filters">
        <div className="whale-toggles">
          {['all', 'polymarket', 'kalshi'].map(p => (
            <button
              key={p}
              className={`explore-toggle ${platform === p ? 'active' : ''}`}
              onClick={() => setPlatform(p)}
            >
              {p === 'all' ? 'All' : p === 'polymarket' ? 'Polymarket' : 'Kalshi'}
            </button>
          ))}
        </div>
        <select
          className="explore-select"
          value={minSize}
          onChange={(e) => setMinSize(e.target.value)}
        >
          {SIZE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <div className="refresh-indicator">
          <span className={`refresh-dot ${isPro ? '' : 'stale'}`} />
          {isPro
            ? <>Live &middot; refreshes in {countdown}s</>
            : <span style={{ color: '#34d399' }}>Demo Data</span>
          }
          {isPro && (
            <button
              className={`refresh-btn ${loading ? 'refreshing' : ''}`}
              onClick={() => fetchTrades(true)}
              disabled={loading}
              title="Refresh now"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="whale-meta">
        {isPro
          ? (loading ? 'Loading trades...' : `${trades.length} trades`)
          : `${displayTrades.length} sample trades`
        }
      </div>

      <div className="upgrade-overlay-wrapper">
        <div className="whale-container">
          <div className="whale-header">
            <div className="whale-col-time">Time</div>
            <div className="whale-col-platform">Platform</div>
            <div className="whale-col-market">Market</div>
            <div className="whale-col-side">Side</div>
            <div className="whale-col-price">Price</div>
            <div className="whale-col-contracts">Contracts</div>
            <div className="whale-col-size">Size</div>
            <div className="whale-col-score">Score</div>
          </div>

          <div className="whale-body">
            {visibleTrades.map((t, i) => (
              <TradeRow key={i} trade={t} />
            ))}
            {blurredTrades.map((t, i) => (
              <div key={`blur-${i}`} className="mt-blurred">
                <TradeRow trade={t} />
              </div>
            ))}
            {isPro && !loading && trades.length === 0 && (
              <div className="whale-empty">No trades found matching filters</div>
            )}
          </div>
        </div>

        {!isPro && (
          <div className="upgrade-overlay">
            <div className="upgrade-card">
              <h3>Whale Tracking is a Pro feature</h3>
              <p>Follow smart money in real time. See large trades, repeat whales, and market-moving activity across Polymarket and Kalshi.</p>
              <a href="/signup" className="upgrade-btn">Start free trial</a>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function TradeRow({ trade: t }) {
  const platformClass = t.platform === 'polymarket' ? 'badge-poly' : 'badge-kalshi'
  const sideClass = t.side === 'BUY' || t.side === 'YES' ? 'whale-side-yes' : 'whale-side-no'
  const score = t.whaleScore || 0
  const isLarge = score >= 60
  const isHuge = score >= 90
  const isBigDollar = (t.dollarValue || 0) >= 5000

  let scoreClass = 'whale-score-low'
  if (score >= 90) scoreClass = 'whale-score-mega'
  else if (score >= 70) scoreClass = 'whale-score-high'
  else if (score >= 50) scoreClass = 'whale-score-mid'
  else if (score >= 30) scoreClass = 'whale-score-notable'

  const traderTitle = t.isRepeatWhale
    ? `Repeat whale: ${t.walletTradeCount} trades totaling ${t.walletTotalFormatted}`
    : t.trader || ''

  return (
    <div className={`whale-row ${isHuge ? 'whale-huge' : isLarge ? 'whale-large' : ''} ${isBigDollar ? 'whale-big-dollar' : ''}`} title={traderTitle}>
      <div className="whale-col-time">{timeAgo(t.time)}</div>
      <div className="whale-col-platform">
        <span className={`explore-badge ${platformClass}`}>
          {t.platform === 'polymarket' ? 'Poly' : 'Kalshi'}
        </span>
      </div>
      <div className="whale-col-market">
        <div className="whale-market-wrap">
          {t.url ? (
            <a href={t.url} target="_blank" rel="noopener noreferrer" className="whale-market-link">
              {t.market}
            </a>
          ) : (
            <span>{t.market}</span>
          )}
          <div className="whale-market-badges">
            {t.isRepeatWhale && (
              <span className="whale-repeat-badge" title={traderTitle}>
                Repeat
              </span>
            )}
            {t.trader && (
              <span className="whale-trader-name">{t.trader}</span>
            )}
          </div>
        </div>
      </div>
      <div className={`whale-col-side ${sideClass}`}>
        {t.side} {t.outcome}
      </div>
      <div className="whale-col-price">{t.price}&cent;</div>
      <div className="whale-col-contracts">{t.contracts.toLocaleString()}</div>
      <div className="whale-col-size whale-size-value">{t.dollarFormatted}</div>
      <div className={`whale-col-score ${scoreClass}`}>
        {t.whaleLabel || '—'}
      </div>
    </div>
  )
}
